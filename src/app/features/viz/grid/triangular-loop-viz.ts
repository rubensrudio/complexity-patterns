import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { costFor } from '../../../core/complexity';
import { PatternViz } from '../../../core/patterns.model';
import { gridPattern, pairOrder, triCycleLength, triFrame } from './grid-frames';

const PATTERN = gridPattern('triangular-loop');

/** O(n²): only the strict lower triangle (j < i) of an n × n grid is visited. */
@Component({
  selector: 'app-triangular-loop-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './grid-viz.scss',
  styles: `
    .cell.diag {
      background: transparent;
      border-style: dashed;
      border-color: color-mix(in srgb, var(--viz-color) 35%, var(--cell-border));
    }
    .cell.upper {
      opacity: 0.32;
    }
  `,
  template: `
    <div class="viz" role="img" [attr.aria-label]="ariaLabel()" [style.--viz-color]="color()">
      <div class="grid" [style.--n]="n">
        @for (c of cells(); track c.key) {
          <span
            class="cell"
            [class.on]="c.on"
            [class.cur]="c.cur"
            [class.diag]="c.diag"
            [class.upper]="c.upper"
          ></span>
        }
      </div>
      <div class="side">
        <span class="label">{{ vizLabel }}</span>
        <span class="label">{{ position() }}</span>
      </div>
    </div>
  `,
})
export class TriangularLoopViz implements PatternViz {
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();

  readonly n = PATTERN.vizN;
  readonly vizLabel = PATTERN.vizLabel;
  readonly cost = costFor(PATTERN.id, this.n);
  readonly cycleLength = triCycleLength(this.n);

  private readonly frame = computed(() => triFrame(this.step(), this.n));

  protected readonly cells = computed(() => {
    const { ops, row, col } = this.frame();
    const out: { key: number; on: boolean; cur: boolean; diag: boolean; upper: boolean }[] = [];
    for (let i = 0; i < this.n; i++) {
      for (let j = 0; j < this.n; j++) {
        const k = pairOrder('triangular', i, j, this.n);
        out.push({
          key: i * this.n + j,
          on: k >= 0 && k < ops,
          cur: i === row && j === col,
          diag: i === j,
          upper: j > i,
        });
      }
    }
    return out;
  });

  protected readonly position = computed(() => {
    const f = this.frame();
    if (f.row < 0) return f.done ? `${this.cost} pairs` : `j < i`;
    return `i ${f.row} · j ${f.col}`;
  });

  protected readonly ariaLabel = computed(() => {
    const f = this.frame();
    const total = `${f.ops} of ${this.cost} pairs`;
    if (f.done) return `${PATTERN.title}: complete, lower triangle filled, ${total}`;
    if (f.row < 0) return `${PATTERN.title}: ready, pairs with j below i in a ${this.n} by ${this.n} grid, ${total}`;
    return `${PATTERN.title}: row ${f.row + 1}, column ${f.col + 1}, ${total}`;
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
