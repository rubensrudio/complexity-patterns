import { costFor } from '../../../core/complexity';
import { PATTERNS } from '../../../core/patterns.data';
import { PatternId } from '../../../core/patterns.model';
import {
  dcCycleLength,
  dcFrame,
  lbsCycleLength,
  lbsFrame,
  nestedCycleLength,
  nestedFrame,
  triCycleLength,
  triFrame,
} from './grid-frames';

const vizN = (id: PatternId) => PATTERNS.find((p) => p.id === id)!.vizN;

interface Model {
  id: PatternId;
  cycle: (n: number) => number;
  frame: (step: number, n: number) => { ops: number };
}

const MODELS: Model[] = [
  { id: 'loop-binary-search', cycle: lbsCycleLength, frame: lbsFrame },
  { id: 'divide-conquer', cycle: dcCycleLength, frame: dcFrame },
  { id: 'nested-loop', cycle: nestedCycleLength, frame: nestedFrame },
  { id: 'triangular-loop', cycle: triCycleLength, frame: triFrame },
];

describe.each(MODELS)('frame model $id', ({ id, cycle, frame }) => {
  const n = vizN(id);
  const len = cycle(n);

  it('R1: is a pure function of step % cycleLength', () => {
    for (let s = 0; s < len; s++) {
      expect(frame(s, n)).toEqual(frame(s, n));
      expect(frame(s + len, n)).toEqual(frame(s, n));
      expect(frame(s + 3 * len, n)).toEqual(frame(s, n));
    }
  });

  it('R2: ops start at 0, never decrease and end at costFor(id, vizN) with a hold', () => {
    const cost = costFor(id, n);
    expect(frame(0, n).ops).toBe(0);
    let prev = 0;
    for (let s = 0; s < len; s++) {
      const ops = frame(s, n).ops;
      expect(ops).toBeGreaterThanOrEqual(prev);
      prev = ops;
    }
    expect(frame(len - 1, n).ops).toBe(cost);
    expect(frame(len - 2, n).ops).toBe(cost); // hold
    expect(frame(len, n).ops).toBe(0); // loops
  });
});

describe('loop + binary search frames', () => {
  const n = vizN('loop-binary-search');

  it('searches each element in max(1, ceilLog2(n)) steps ending in a hit', () => {
    const f1 = lbsFrame(1, n);
    expect(f1.element).toBe(0);
    expect(f1.searchStep).toBe(1);
    expect(f1.searchSteps).toBe(4);
    expect(f1.hi - f1.lo).toBe(n);
    const f4 = lbsFrame(4, n);
    expect(f4.found).toBe(true);
    expect(f4.mid).toBe(f4.target);
    const f5 = lbsFrame(5, n);
    expect(f5.element).toBe(1);
    expect(f5.found).toBe(false);
  });

  it('shrinks the interval at every step of a search', () => {
    for (let s = 2; s <= 4; s++) {
      const a = lbsFrame(s - 1, n);
      const b = lbsFrame(s, n);
      expect(b.hi - b.lo).toBeLessThanOrEqual(a.hi - a.lo);
      expect(b.target).toBeGreaterThanOrEqual(b.lo);
      expect(b.target).toBeLessThan(b.hi);
    }
  });
});

describe('divide & conquer frames', () => {
  const n = vizN('divide-conquer');

  it('builds log n work levels of n plus a leaf row', () => {
    const f = dcFrame(0, n);
    expect(f.levels.map((l) => l.length)).toEqual([1, 2, 4, 8]);
    expect(f.levels.map((l) => l.reduce((a, s) => a + s.size, 0))).toEqual([8, 8, 8, 8]);
    expect(f.levels.flat().some((s) => s.on)).toBe(false);
  });

  it('lights segment by segment and each work level adds n', () => {
    expect(dcFrame(1, n).ops).toBe(8);
    expect(dcFrame(2, n).ops).toBe(12);
    expect(dcFrame(3, n).ops).toBe(16);
    expect(dcFrame(7, n).ops).toBe(24);
    expect(dcFrame(2, n).levels[1].map((s) => s.on)).toEqual([true, false]);
  });
});

describe('nested loop frames', () => {
  const n = vizN('nested-loop');

  it('fills row by row', () => {
    const f = nestedFrame(8, n);
    expect(f.ops).toBe(8);
    expect(f.row).toBe(1);
    expect(f.col).toBe(1);
  });
});

describe('triangular loop frames', () => {
  const n = vizN('triangular-loop');

  it('only visits the strict lower triangle (j < i)', () => {
    const len = triCycleLength(n);
    for (let s = 1; s < len; s++) {
      const f = triFrame(s, n);
      if (f.row >= 0) expect(f.col).toBeLessThan(f.row);
    }
    expect(triFrame(1, n)).toMatchObject({ row: 1, col: 0, ops: 1 });
    expect(triFrame(3, n)).toMatchObject({ row: 2, col: 1, ops: 3 });
  });
});
