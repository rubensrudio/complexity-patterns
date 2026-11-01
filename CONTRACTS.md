# Contracts — complexity-patterns

Source of truth: `src/app/core/` (read-only for feature agents).

## Files
- `patterns.model.ts` — `PatternId`, `PatternTone`, `PatternDef`, `PatternViz`, `toneVar()`.
- `patterns.data.ts` — `PATTERNS`: the 10 patterns in board order (title, code lines, Big-O, caption, vizLabel, tone, vizN).
- `complexity.ts` — `costFor(id, n)` operation count per pattern (also `ceilLog2`, `factorial`, `secondSize`). Throws `RangeError` for n < 0 or non-finite n.
- `animation-clock.ts` — `AnimationClock` (root service): `tick`, `playing`, `speed` signals; `play/pause/toggle/stepOnce/reset/setSpeed`. Speeds: 0.5, 1, 2, 4 (`setSpeed` of other values throws `RangeError`). Starts paused when the user prefers reduced motion.
- `viz-registry.ts` — `VIZ_REGISTRY[id]` → visualization component class.

## Visualization rules (agents viz-linear, viz-grid, viz-tree)
1. One standalone, OnPush component per pattern, keeping the existing file name, class name and selector of the stub.
2. Implements `PatternViz`: `step = input.required<number>()`, `color = input.required<string>()`, `opsChange = output<number>()`. No other required inputs.
3. Animation is a pure function of `step`: `frame = step % cycleLength` (cycleLength chosen by the component, including a short hold at the end of the cycle). It loops forever. No own timers, no `setInterval`, no `requestAnimationFrame`, no dependency on AnimationClock.
4. `opsChange` emits the operations executed so far in the current cycle: 0 at the start of a cycle, monotonic non-decreasing during it, and exactly `costFor(id, vizN)` at the end (during the hold). Emit only when the value changes. Use `vizN` from `PATTERNS`, never a hard-coded size.
5. Visual: cells/nodes in `var(--cell)` with `var(--cell-border)`; active/visited elements use the `color` input (fill, border or glow). Fixed height of 96px, width 100% of the container (max ~340px of content). CSS transitions for smoothness are fine. Small labels in `var(--font-mono)` and `var(--text-muted)`.
6. Accessibility: root element has `role="img"` and an `aria-label` that describes the current state (e.g. "Single loop: visiting index 3 of 12").

## Board rules (agent board)
- `<app-board>` renders a header row (PATTERN · VISUALIZATION · BIG-O) and one row per `PATTERNS` item.
- PATTERN column: `index. title` in the tone color, and the code lines in mono with light syntax highlight (keywords `for/while/in`, numbers, function calls `name(`), using `--code-*` tokens.
- VISUALIZATION column: the component from `VIZ_REGISTRY` via `NgComponentOutlet` with inputs `{ step: clock.tick(), color: toneVar(tone) }`, and an op counter `ops: X / costFor(id, vizN)` fed by `opsChange` (subscribe through `ComponentRef`/outlet instance).
- BIG-O column: label in the tone color (large) and the caption.
- Controls bar: play/pause, step once, reset, speed buttons (CLOCK_SPEEDS), using `AnimationClock`. Keyboard: Space toggles play when the board is focused.
- Responsive: under 720px the three columns stack.

## Growth chart rules (agent growth-chart)
- `<app-growth-chart>` plots `costFor(id, n)` for all 10 patterns, n = 1..N, as SVG polylines in each tone.
- Slider for N (range 2..32, default 16). Y axis log scale (log10 of ops, with values ≤ 0 treated as 1); values ≥ 1e12 or Infinity are clipped at the top edge.
- Legend with the 10 Big-O labels; hovering/focusing a legend item highlights that curve and dims the others.
- A table under the chart (or tooltip) shows the exact ops at the current N for each pattern, formatted with `toLocaleString('en-US')`; above 1e12 show exponential notation.
- Pure SVG, no chart libraries.
