import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { costFor } from '../../../core/complexity';
import { PatternViz } from '../../../core/patterns.model';
import { gridPattern, nestedCycleLength, nestedFrame, pairOrder } from './grid-frames';

const PATTERN = gridPattern('nested-loop');

/** O(n²): an n × n grid filled row by row; the current (i, j) cell glows. */
@Component({
  selector: 'app-nested-loop-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './grid-viz.scss',
  template: `
    <div class="viz" role="img" [attr.aria-label]="ariaLabel()" [style.--viz-color]="color()">
      <div class="grid" [style.--n]="n">
        @for (c of cells(); track c.k) {
          <span class="cell" [class.on]="c.on" [class.cur]="c.cur"></span>
        }
      </div>
      <div class="side">
        <span class="label">{{ vizLabel }}</span>
        <span class="label">{{ position() }}</span>
      </div>
    </div>
  `,
})
export class NestedLoopViz implements PatternViz {
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();

  readonly n = PATTERN.vizN;
  readonly vizLabel = PATTERN.vizLabel;
  readonly cost = costFor(PATTERN.id, this.n);
  readonly cycleLength = nestedCycleLength(this.n);

  private readonly frame = computed(() => nestedFrame(this.step(), this.n));

  protected readonly cells = computed(() => {
    const { ops, row, col } = this.frame();
    const out: { k: number; on: boolean; cur: boolean }[] = [];
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        const k = pairOrder('nested', i, j, this.n);
        out.push({ k, on: k < ops, cur: i === row && j === col });
      }
    }
    return out;
  });

  protected readonly position = computed(() => {
    const f = this.frame();
    if (f.row < 0) return f.done ? `${this.cost} pairs` : `n = ${this.n}`;
    return `i ${f.row} · j ${f.col}`;
  });

  protected readonly ariaLabel = computed(() => {
    const f = this.frame();
    const total = `${f.ops} of ${this.cost} pairs`;
    if (f.done) return `${PATTERN.title}: complete, ${total}`;
    if (f.row < 0) return `${PATTERN.title}: ready, ${this.n} by ${this.n} grid, ${total}`;
    return `${PATTERN.title}: row ${f.row + 1}, column ${f.col + 1} of ${this.n}, ${total}`;
  });

  private lastOps: number | null = null;

  constructor() {
    effect(() => {
      const ops = this.frame().ops;
      if (ops !== this.lastOps) {
        this.lastOps = ops;
        this.opsChange.emit(ops);
      }
    });
  }
}
