import { InputSignal, OutputEmitterRef } from '@angular/core';

/** Stable identifiers of the 10 complexity patterns, in display order. */
export type PatternId =
  | 'hash-lookup'
  | 'halving-loop'
  | 'single-loop'
  | 'sequential-loops'
  | 'loop-binary-search'
  | 'divide-conquer'
  | 'nested-loop'
  | 'triangular-loop'
  | 'branching-recursion'
  | 'permutations';

/** Color family of a pattern. Maps to CSS custom property `--tone-<tone>` in styles.scss. */
export type PatternTone = 'green' | 'violet' | 'cyan' | 'indigo' | 'teal' | 'pink' | 'amber' | 'red';

export interface PatternDef {
  readonly id: PatternId;
  /** 1-based position on the board. */
  readonly index: number;
  readonly title: string;
  /** Source lines shown in the PATTERN column (no trailing newline, indentation with spaces). */
  readonly code: readonly string[];
  /** Big-O label, e.g. 'O(n²)'. */
  readonly bigO: string;
  /** Short explanation under the Big-O label. */
  readonly caption: string;
  /** Small caption the visualization may render (e.g. 'log n search per element'). */
  readonly vizLabel: string;
  readonly tone: PatternTone;
  /** Input size n used by the animation of this pattern. */
  readonly vizN: number;
}

/**
 * Contract every visualization component implements.
 *
 * - `step`: global monotonic tick from AnimationClock (0, 1, 2, ...). The component derives its
 *   own frame from it (e.g. `step % cycleLength`) and must loop forever.
 * - `color`: CSS color value for the active elements (e.g. 'var(--tone-green)').
 * - `opsChange`: emits the number of basic operations already executed in the current cycle.
 *   It starts each cycle at 0 and its last value in the cycle MUST equal
 *   `costFor(pattern.id, pattern.vizN)`. Emit only when the value changes.
 */
export interface PatternViz {
  readonly step: InputSignal<number>;
  readonly color: InputSignal<string>;
  readonly opsChange: OutputEmitterRef<number>;
}

export function toneVar(tone: PatternTone): string {
  return `var(--tone-${tone})`;
}
