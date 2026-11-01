import { costFor } from '../../core/complexity';
import { PATTERNS } from '../../core/patterns.data';
import {
  CLIP_LIMIT,
  buildSeries,
  curvePath,
  decadeTicks,
  formatOps,
  logValue,
  rankAtN,
  topDecade,
  xScale,
  yScale,
} from './growth-chart.math';

describe('growth-chart math', () => {
  describe('R1 buildSeries', () => {
    it('returns one series per pattern, in board order', () => {
      const series = buildSeries(16);
      expect(series.map((s) => s.id)).toEqual(PATTERNS.map((p) => p.id));
    });

    it('has points (n, costFor(id, n)) for n = 1..N', () => {
      const series = buildSeries(5);
      for (const s of series) {
        expect(s.points.map((p) => p.n)).toEqual([1, 2, 3, 4, 5]);
        for (const p of s.points) expect(p.ops).toBe(costFor(s.id, p.n));
      }
    });

    it('rejects N < 1 or non-integer N', () => {
      expect(() => buildSeries(0)).toThrow(RangeError);
      expect(() => buildSeries(2.5)).toThrow(RangeError);
    });
  });

  describe('R2 scales', () => {
    it('logValue: log10 of ops, values <= 0 treated as 1, clipped at 1e12 / Infinity', () => {
      expect(logValue(0)).toEqual({ value: 0, clipped: false });
      expect(logValue(-3)).toEqual({ value: 0, clipped: false });
      expect(logValue(1)).toEqual({ value: 0, clipped: false });
      expect(logValue(1000).value).toBeCloseTo(3);
      expect(logValue(1000).clipped).toBe(false);
      expect(logValue(CLIP_LIMIT)).toEqual({ value: 12, clipped: true });
      expect(logValue(2.6e35)).toEqual({ value: 12, clipped: true });
      expect(logValue(Infinity)).toEqual({ value: 12, clipped: true });
    });

    it('topDecade: smallest decade covering the max, capped at 12, at least 1', () => {
      expect(topDecade(1)).toBe(1);
      expect(topDecade(4)).toBe(1);
      expect(topDecade(10)).toBe(1);
      expect(topDecade(11)).toBe(2);
      expect(topDecade(65535)).toBe(5);
      expect(topDecade(2.6e35)).toBe(12);
      expect(topDecade(Infinity)).toBe(12);
    });

    it('yScale maps log value linearly: 1 at bottom, top decade (and clipped) at top', () => {
      const y = yScale({ top: 10, bottom: 210, decades: 4 });
      expect(y(1).y).toBe(210);
      expect(y(0).y).toBe(210);
      expect(y(100).y).toBeCloseTo(110);
      expect(y(1e4).y).toBeCloseTo(10);
      expect(y(Infinity)).toEqual({ y: 10, clipped: true });
      // values above the top decade but under 1e12 still stay inside the plot
      expect(y(1e8).y).toBe(10);
    });

    it('xScale maps 1..N linearly onto [left, right]', () => {
      const x = xScale({ left: 40, right: 140, maxN: 11 });
      expect(x(1)).toBe(40);
      expect(x(6)).toBe(90);
      expect(x(11)).toBe(140);
    });

    it('decadeTicks lists 10^0 .. 10^top', () => {
      expect(decadeTicks(3)).toEqual([
        { k: 0, value: 1 },
        { k: 1, value: 10 },
        { k: 2, value: 100 },
        { k: 3, value: 1000 },
      ]);
    });
  });

  describe('R5 formatting and ranking', () => {
    it('formats with en-US grouping below 1e12 and exponential at or above', () => {
      expect(formatOps(0)).toBe('0');
      expect(formatOps(65535)).toBe('65,535');
      expect(formatOps(999_999_999_999)).toBe('999,999,999,999');
      expect(formatOps(1e12)).toBe('1.0e+12');
      expect(formatOps(2.631308369336935e35)).toBe('2.6e+35');
      expect(formatOps(Infinity)).toBe('∞');
    });

    it('ranks the 10 patterns by ascending cost at N (stable on ties)', () => {
      const rows = rankAtN(16);
      expect(rows).toHaveLength(10);
      const ops = rows.map((r) => r.ops);
      expect(ops).toEqual([...ops].sort((a, b) => a - b));
      expect(rows[0].id).toBe('hash-lookup');
      expect(rows[9].id).toBe('permutations');
      const ties = rows.filter((r) => r.id === 'loop-binary-search' || r.id === 'divide-conquer');
      expect(ties.map((r) => r.id)).toEqual(['loop-binary-search', 'divide-conquer']);
      for (const r of rows) expect(r.ops).toBe(costFor(r.id, 16));
    });
  });
});

describe('R6 curvePath', () => {
  it('builds an SVG path through the points, padded with the last point to a fixed length', () => {
    const d = curvePath([{ x: 0, y: 10 }, { x: 5.25, y: 2 }], 4);
    expect(d).toBe('M0,10 L5.3,2 L5.3,2 L5.3,2');
  });
});
