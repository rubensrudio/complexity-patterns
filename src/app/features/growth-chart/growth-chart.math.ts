import { costFor } from '../../core/complexity';
import { PATTERNS } from '../../core/patterns.data';
import { PatternId } from '../../core/patterns.model';

/** Values at or above this (and Infinity) are clipped at the top edge of the chart. */
export const CLIP_LIMIT = 1e12;
/** log10(CLIP_LIMIT): the highest decade the chart can ever show. */
export const MAX_DECADE = 12;

export interface SeriesPoint {
  readonly n: number;
  readonly ops: number;
}

export interface Series {
  readonly id: PatternId;
  readonly points: readonly SeriesPoint[];
}

export interface LogValue {
  /** log10 of the ops (0 for ops <= 1, MAX_DECADE when clipped). */
  readonly value: number;
  readonly clipped: boolean;
}

export interface Scaled {
  readonly y: number;
  readonly clipped: boolean;
}

export interface DecadeTick {
  readonly k: number;
  readonly value: number;
}

export interface RankRow {
  readonly id: PatternId;
  readonly ops: number;
}

/** One series per pattern (board order) with points (n, costFor(id, n)) for n = 1..maxN. */
export function buildSeries(maxN: number): Series[] {
  if (!Number.isInteger(maxN) || maxN < 1) throw new RangeError(`invalid N: ${maxN}`);
  return PATTERNS.map((p) => ({
    id: p.id,
    points: Array.from({ length: maxN }, (_, i) => ({ n: i + 1, ops: costFor(p.id, i + 1) })),
  }));
}

/** log10 of ops; ops <= 0 are treated as 1 and ops >= CLIP_LIMIT (or Infinity) are clipped. */
export function logValue(ops: number): LogValue {
  if (!(ops < CLIP_LIMIT)) return { value: MAX_DECADE, clipped: true };
  return { value: ops <= 1 ? 0 : Math.log10(ops), clipped: false };
}

/** Smallest decade k with 10^k >= maxOps, between 1 and MAX_DECADE. */
export function topDecade(maxOps: number): number {
  const { value } = logValue(maxOps);
  return Math.min(MAX_DECADE, Math.max(1, Math.ceil(value - 1e-9)));
}

/** Log scale: ops = 1 maps to `bottom`, 10^decades (or anything clipped) maps to `top`. */
export function yScale(o: { top: number; bottom: number; decades: number }): (ops: number) => Scaled {
  const span = o.bottom - o.top;
  return (ops) => {
    const { value, clipped } = logValue(ops);
    const t = Math.min(1, value / o.decades);
    return { y: clipped ? o.top : o.bottom - t * span, clipped };
  };
}

/** Linear scale of n from 1..maxN onto [left, right]. */
export function xScale(o: { left: number; right: number; maxN: number }): (n: number) => number {
  const span = o.right - o.left;
  const steps = Math.max(1, o.maxN - 1);
  return (n) => o.left + ((n - 1) / steps) * span;
}

/** Grid lines at 10^0 .. 10^top. */
export function decadeTicks(top: number): DecadeTick[] {
  return Array.from({ length: top + 1 }, (_, k) => ({ k, value: 10 ** k }));
}

/** en-US grouping below CLIP_LIMIT, exponential notation at or above it. */
export function formatOps(ops: number): string {
  if (ops === Infinity) return '∞';
  if (ops >= CLIP_LIMIT) return ops.toExponential(1);
  return ops.toLocaleString('en-US');
}

/** All patterns with their cost at n, sorted by ascending cost (board order on ties). */
export function rankAtN(n: number): RankRow[] {
  return PATTERNS.map((p) => ({ id: p.id, ops: costFor(p.id, n) })).sort((a, b) => a.ops - b.ops);
}

const round1 = (v: number): number => Math.round(v * 10) / 10;

/**
 * SVG path through the points. Padded with copies of the last point up to `length` commands so
 * every curve keeps the same command count for any N, which lets CSS transition `d` smoothly.
 */
export function curvePath(points: readonly { x: number; y: number }[], length: number): string {
  if (points.length === 0) return '';
  const last = points[points.length - 1];
  const all = [...points, ...Array.from({ length: Math.max(0, length - points.length) }, () => last)];
  return all.map((p, i) => `${i === 0 ? 'M' : 'L'}${round1(p.x)},${round1(p.y)}`).join(' ');
}
