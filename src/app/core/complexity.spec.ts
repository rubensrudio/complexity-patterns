import { ceilLog2, costFor, factorial, secondSize } from './complexity';
import { PATTERNS } from './patterns.data';

describe('complexity', () => {
  it('helpers', () => {
    expect(ceilLog2(1)).toBe(0);
    expect(ceilLog2(64)).toBe(6);
    expect(ceilLog2(10)).toBe(4);
    expect(factorial(4)).toBe(24);
    expect(secondSize(12)).toBe(9);
  });

  it('costs at the animation sizes', () => {
    const expected: Record<string, number> = {
      'hash-lookup': 1,
      'halving-loop': 6,
      'single-loop': 12,
      'sequential-loops': 21,
      'loop-binary-search': 40,
      'divide-conquer': 24,
      'nested-loop': 36,
      'triangular-loop': 15,
      'branching-recursion': 15,
      permutations: 24,
    };
    for (const p of PATTERNS) expect(costFor(p.id, p.vizN)).toBe(expected[p.id]);
  });

  it('rejects invalid n', () => {
    expect(() => costFor('single-loop', -1)).toThrow(RangeError);
    expect(() => costFor('single-loop', Number.NaN)).toThrow(RangeError);
  });

  it('has 10 patterns in order', () => {
    expect(PATTERNS.map((p) => p.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});
