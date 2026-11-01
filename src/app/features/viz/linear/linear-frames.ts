import { costFor, secondSize } from '../../../core/complexity';

/**
 * Pure frame functions of the linear visualizations (patterns 1–4).
 * Every frame depends only on `step` and `n`: `frame = step % cycleLength`.
 * Frame 0 is the idle start (ops = 0); the last HOLD_FRAMES frames hold the final state.
 */
export const HOLD_FRAMES = 3;

/** Non-negative modulo, so negative steps still map into the cycle. */
function mod(step: number, len: number): number {
  const s = Math.floor(step);
  return ((s % len) + len) % len;
}

// ---------- 1. Hash lookup ----------

export interface HashFrame {
  readonly ops: number;
  readonly buckets: number;
  readonly bucket: number;
  readonly jumped: boolean;
}

export function hashCycle(_n: number): number {
  return 1 + costFor('hash-lookup', _n) + HOLD_FRAMES;
}

export function hashFrame(step: number, n: number): HashFrame {
  const len = hashCycle(n);
  const frame = mod(step, len);
  const cycle = Math.floor((Math.floor(step) - frame) / len);
  const buckets = Math.max(1, n);
  // Deterministic pseudo-hash of the cycle index; 5 is coprime with 8 so every bucket is visited.
  const bucket = mod(cycle * 5 + 3, buckets);
  const jumped = frame >= 1;
  return { ops: jumped ? costFor('hash-lookup', n) : 0, buckets, bucket, jumped };
}

// ---------- 2. Halving loop ----------

export interface HalvingFrame {
  readonly ops: number;
  /** Halvings performed so far (k). */
  readonly steps: number;
  readonly total: number;
  /** Current value of n. */
  readonly value: number;
  readonly n: number;
}

export function halvingCycle(n: number): number {
  return 1 + costFor('halving-loop', n) + HOLD_FRAMES;
}

export function halvingFrame(step: number, n: number): HalvingFrame {
  const total = costFor('halving-loop', n);
  const steps = Math.min(mod(step, halvingCycle(n)), total);
  const value = Math.max(1, Math.ceil(n / 2 ** steps));
  return { ops: steps, steps, total, value, n };
}

// ---------- 3. Single loop ----------

export interface SingleFrame {
  readonly ops: number;
  readonly size: number;
  /** Index under the cursor, -1 before the loop starts. */
  readonly cursor: number;
  readonly visited: number;
}

export function singleCycle(n: number): number {
  return 1 + costFor('single-loop', n) + HOLD_FRAMES;
}

export function singleFrame(step: number, n: number): SingleFrame {
  const visited = Math.min(mod(step, singleCycle(n)), n);
  return { ops: visited, size: n, cursor: visited - 1, visited };
}

// ---------- 4. Sequential loops ----------

export interface SequentialFrame {
  readonly ops: number;
  readonly n: number;
  readonly m: number;
  /** Row currently being walked; null before the first loop starts. */
  readonly row: 'n' | 'm' | null;
  readonly cursor: number;
  readonly visitedN: number;
  readonly visitedM: number;
}

export function sequentialCycle(n: number): number {
  return 1 + costFor('sequential-loops', n) + HOLD_FRAMES;
}

export function sequentialFrame(step: number, n: number): SequentialFrame {
  const m = secondSize(n);
  const ops = Math.min(mod(step, sequentialCycle(n)), n + m);
  const visitedN = Math.min(ops, n);
  const visitedM = Math.max(0, ops - n);
  const row = ops === 0 ? null : visitedM > 0 ? 'm' : 'n';
  const cursor = row === 'm' ? visitedM - 1 : visitedN - 1;
  return { ops, n, m, row, cursor, visitedN, visitedM };
}
