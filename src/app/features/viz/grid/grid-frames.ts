import { ceilLog2 } from '../../../core/complexity';
import { PATTERNS } from '../../../core/patterns.data';
import { PatternDef, PatternId } from '../../../core/patterns.model';

/**
 * Pure frame models of the grid visualizations (patterns 5–8).
 *
 * Every cycle is: frame 0 (idle, 0 ops) → one frame per unit of work → HOLD frames at full cost.
 * A frame depends only on `step % cycleLength`, so the same step always yields the same state.
 */

/** Frames kept at the end of a cycle with the final operation count. */
export const HOLD_FRAMES = 4;

/** Frame index inside the cycle (handles any integer step, including negative ones). */
export function frameOf(step: number, cycleLength: number): number {
  const s = Math.trunc(Number.isFinite(step) ? step : 0);
  return ((s % cycleLength) + cycleLength) % cycleLength;
}

/* ───────────────────────── 5. Loop + Binary Search ───────────────────────── */

export interface LbsFrame {
  readonly ops: number;
  /** Element visited by the outer loop (-1 before the first one). */
  readonly element: number;
  /** 1-based step of the current binary search (0 when idle). */
  readonly searchStep: number;
  readonly searchSteps: number;
  /** Current search interval [lo, hi) and the probed index. */
  readonly lo: number;
  readonly hi: number;
  readonly mid: number;
  readonly target: number;
  readonly found: boolean;
  readonly done: boolean;
}

export function lbsSearchSteps(n: number): number {
  return Math.max(1, ceilLog2(n));
}

export function lbsCycleLength(n: number): number {
  return 1 + n * lbsSearchSteps(n) + HOLD_FRAMES;
}

/** Deterministic, varied target index searched for element i. */
export function lbsTarget(i: number, n: number): number {
  return n > 0 ? (i * 7 + 3) % n : 0;
}

export function lbsFrame(step: number, n: number): LbsFrame {
  const steps = lbsSearchSteps(n);
  const work = n * steps;
  const f = frameOf(step, lbsCycleLength(n));
  if (f === 0) {
    return { ops: 0, element: -1, searchStep: 0, searchSteps: steps, lo: 0, hi: n, mid: -1, target: -1, found: false, done: false };
  }
  const done = f > work;
  const k = Math.min(f, work);
  const element = Math.floor((k - 1) / steps);
  const searchStep = ((k - 1) % steps) + 1;
  const target = lbsTarget(element, n);
  let lo = 0;
  let hi = n;
  for (let s = 1; s < searchStep && hi - lo > 1; s++) {
    const m = Math.floor((lo + hi) / 2);
    if (target < m) hi = m;
    else lo = m;
  }
  const found = searchStep === steps;
  const mid = found ? target : Math.floor((lo + hi) / 2);
  return { ops: k, element, searchStep, searchSteps: steps, lo, hi, mid, target, found, done };
}

/* ───────────────────────── 6. Divide & Conquer ───────────────────────── */

export interface DcSegment {
  readonly start: number;
  readonly size: number;
  readonly on: boolean;
  readonly current: boolean;
}

export interface DcFrame {
  readonly ops: number;
  /** levels[0] is the whole input; the last level holds the unit leaves (base cases). */
  readonly levels: readonly (readonly DcSegment[])[];
  /** Number of levels that do n work each (all but the leaf row). */
  readonly workLevels: number;
  /** Level being worked on (-1 when idle or done). */
  readonly level: number;
  readonly done: boolean;
}

export function dcWorkLevels(n: number): number {
  return Math.max(1, ceilLog2(n));
}

function dcSegmentCount(n: number): number {
  let c = 0;
  for (let l = 0; l < dcWorkLevels(n); l++) c += 2 ** l;
  return c;
}

export function dcCycleLength(n: number): number {
  return 1 + dcSegmentCount(n) + HOLD_FRAMES;
}

export function dcFrame(step: number, n: number): DcFrame {
  const workLevels = dcWorkLevels(n);
  const total = dcSegmentCount(n);
  const f = frameOf(step, dcCycleLength(n));
  const lit = Math.min(f, total);
  const done = f > total;
  let index = 0;
  let ops = 0;
  let level = -1;
  const levels: DcSegment[][] = [];
  for (let l = 0; l <= workLevels; l++) {
    const parts = 2 ** l;
    const row: DcSegment[] = [];
    for (let p = 0; p < parts; p++) {
      const start = Math.floor((p * n) / parts);
      const size = Math.floor(((p + 1) * n) / parts) - start;
      const isWork = l < workLevels;
      const on = isWork ? index < lit : done;
      const current = isWork && index === lit - 1 && !done;
      if (isWork && on) ops += size;
      if (current) level = l;
      if (isWork) index++;
      row.push({ start, size, on, current });
    }
    levels.push(row);
  }
  return { ops, levels, workLevels, level, done };
}

/* ───────────────────────── 7 & 8. Nested / Triangular loops ───────────────────────── */

export interface PairFrame {
  readonly ops: number;
  /** Current (i, j) pair; -1 when idle or holding. */
  readonly row: number;
  readonly col: number;
  readonly done: boolean;
}

export function nestedCycleLength(n: number): number {
  return 1 + n * n + HOLD_FRAMES;
}

export function nestedFrame(step: number, n: number): PairFrame {
  const work = n * n;
  const f = frameOf(step, nestedCycleLength(n));
  if (f === 0 || f > work) return { ops: Math.min(f, work), row: -1, col: -1, done: f > work };
  return { ops: f, row: Math.floor((f - 1) / n), col: (f - 1) % n, done: false };
}

/** Number of pairs (i, j) with 0 <= j < i < n. */
export function triPairs(n: number): number {
  return (n * (n - 1)) / 2;
}

export function triCycleLength(n: number): number {
  return 1 + triPairs(n) + HOLD_FRAMES;
}

export function triFrame(step: number, n: number): PairFrame {
  const work = triPairs(n);
  const f = frameOf(step, triCycleLength(n));
  if (f === 0 || f > work) return { ops: Math.min(f, work), row: -1, col: -1, done: f > work };
  // k-th pair in row-major order of the strict lower triangle: row i starts at i(i-1)/2.
  const k = f - 1;
  let row = 1;
  while (((row + 1) * row) / 2 <= k) row++;
  return { ops: f, row, col: k - (row * (row - 1)) / 2, done: false };
}

/** Index of a visited cell in fill order, or -1 if the cell is never visited. */
export function pairOrder(kind: 'nested' | 'triangular', i: number, j: number, n: number): number {
  if (kind === 'nested') return i * n + j;
  return j < i ? (i * (i - 1)) / 2 + j : -1;
}

/** Pattern definition (title, vizN, vizLabel) of a grid visualization. Throws if the id is unknown. */
export function gridPattern(id: PatternId): PatternDef {
  const p = PATTERNS.find((x) => x.id === id);
  if (!p) throw new RangeError(`unknown pattern: ${id}`);
  return p;
}
