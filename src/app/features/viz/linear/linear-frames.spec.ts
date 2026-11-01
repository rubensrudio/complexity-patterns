import { costFor, secondSize } from '../../../core/complexity';
import { PATTERNS } from '../../../core/patterns.data';
import { PatternId } from '../../../core/patterns.model';
import {
  HOLD_FRAMES,
  halvingCycle,
  halvingFrame,
  hashCycle,
  hashFrame,
  sequentialCycle,
  sequentialFrame,
  singleCycle,
  singleFrame,
} from './linear-frames';

const vizN = (id: PatternId) => PATTERNS.find((p) => p.id === id)!.vizN;

interface Case {
  id: PatternId;
  cycle: (n: number) => number;
  frame: (step: number, n: number) => { ops: number };
}

const CASES: Case[] = [
  { id: 'hash-lookup', cycle: hashCycle, frame: hashFrame },
  { id: 'halving-loop', cycle: halvingCycle, frame: halvingFrame },
  { id: 'single-loop', cycle: singleCycle, frame: singleFrame },
  { id: 'sequential-loops', cycle: sequentialCycle, frame: sequentialFrame },
];

describe('linear frames', () => {
  for (const c of CASES) {
    describe(c.id, () => {
      const n = vizN(c.id);
      const len = c.cycle(n);

      it('R1: is a pure function of step and loops every cycle', () => {
        for (let s = 0; s < len * 3; s++) {
          expect(c.frame(s, n)).toEqual(c.frame(s, n));
        }
        // ops pattern repeats every cycle
        for (let s = 0; s < len; s++) {
          expect(c.frame(s + len, n).ops).toBe(c.frame(s, n).ops);
          expect(c.frame(s + 5 * len, n).ops).toBe(c.frame(s, n).ops);
        }
      });

      it('R2: ops start at 0, never decrease and end at costFor during the hold', () => {
        const ops = Array.from({ length: len }, (_, s) => c.frame(s, n).ops);
        expect(ops[0]).toBe(0);
        for (let i = 1; i < len; i++) expect(ops[i]).toBeGreaterThanOrEqual(ops[i - 1]);
        const cost = costFor(c.id, n);
        for (let h = 1; h <= HOLD_FRAMES; h++) expect(ops[len - h]).toBe(cost);
      });
    });
  }

  it('hash lookup jumps to a bucket that changes between cycles', () => {
    const n = vizN('hash-lookup');
    const len = hashCycle(n);
    expect(hashFrame(0, n).jumped).toBe(false);
    expect(hashFrame(1, n).jumped).toBe(true);
    const buckets = new Set<number>();
    for (let cyc = 0; cyc < 8; cyc++) {
      const b = hashFrame(cyc * len + 1, n).bucket;
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(n);
      // constant within a cycle
      expect(hashFrame(cyc * len + len - 1, n).bucket).toBe(b);
      buckets.add(b);
    }
    expect(hashFrame(1, n).bucket).not.toBe(hashFrame(len + 1, n).bucket);
    expect(buckets.size).toBeGreaterThan(1);
  });

  it('halving loop halves the active span from n down to 1', () => {
    const n = vizN('halving-loop');
    const values = Array.from({ length: costFor('halving-loop', n) + 1 }, (_, s) => halvingFrame(s, n).value);
    expect(values).toEqual([64, 32, 16, 8, 4, 2, 1]);
    expect(halvingFrame(3, n).steps).toBe(3);
    expect(halvingFrame(halvingCycle(n) - 1, n).value).toBe(1);
  });

  it('single loop moves the cursor left to right', () => {
    const n = vizN('single-loop');
    expect(singleFrame(0, n).cursor).toBe(-1);
    for (let i = 0; i < n; i++) expect(singleFrame(i + 1, n).cursor).toBe(i);
    expect(singleFrame(singleCycle(n) - 1, n).visited).toBe(n);
  });

  it('sequential loops walk the whole n row, then the m row', () => {
    const n = vizN('sequential-loops');
    const m = secondSize(n);
    expect(sequentialFrame(0, n).m).toBe(m);
    expect(sequentialFrame(n, n)).toMatchObject({ row: 'n', cursor: n - 1, visitedN: n, visitedM: 0 });
    expect(sequentialFrame(n + 1, n)).toMatchObject({ row: 'm', cursor: 0, visitedN: n, visitedM: 1 });
    expect(sequentialFrame(n + m, n)).toMatchObject({ row: 'm', cursor: m - 1, visitedM: m });
  });
});
