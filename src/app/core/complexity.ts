import { PatternId } from './patterns.model';

/** For 'sequential-loops', the second input size m is derived from n. */
export function secondSize(n: number): number {
  return Math.ceil(n * 0.75);
}

/** ceil(log2 n), with log of n <= 1 equal to 0. */
export function ceilLog2(n: number): number {
  return n <= 1 ? 0 : Math.ceil(Math.log2(n));
}

export function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/**
 * Number of basic operations performed by each pattern for input size n (n >= 0).
 * Used by the op counters (board) and by the growth chart. Returns Infinity on overflow.
 *
 * hash-lookup          1
 * halving-loop         ceil(log2 n)                (halvings while n > 1)
 * single-loop          n
 * sequential-loops     n + m, m = ceil(0.75 n)
 * loop-binary-search   n * max(1, ceil(log2 n))
 * divide-conquer       n * max(1, ceil(log2 n))
 * nested-loop          n²
 * triangular-loop      n(n-1)/2
 * branching-recursion  2^n - 1                     (calls in a full binary recursion tree of depth n)
 * permutations         n!                          (leaves of the permutation tree)
 */
export function costFor(id: PatternId, n: number): number {
  if (!Number.isFinite(n) || n < 0) throw new RangeError(`invalid n: ${n}`);
  const logN = Math.max(1, ceilLog2(n));
  switch (id) {
    case 'hash-lookup':
      return 1;
    case 'halving-loop':
      return ceilLog2(n);
    case 'single-loop':
      return n;
    case 'sequential-loops':
      return n + secondSize(n);
    case 'loop-binary-search':
    case 'divide-conquer':
      return n * logN;
    case 'nested-loop':
      return n * n;
    case 'triangular-loop':
      return (n * (n - 1)) / 2;
    case 'branching-recursion':
      return 2 ** n - 1;
    case 'permutations':
      return factorial(n);
  }
}
