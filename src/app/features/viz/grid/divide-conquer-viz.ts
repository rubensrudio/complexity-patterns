import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { costFor } from '../../../core/complexity';
import { PatternViz } from '../../../core/patterns.model';
import { dcCycleLength, dcFrame, gridPattern } from './grid-frames';

const PATTERN = gridPattern('divide-conquer');

/**
 * O(n log n): a recursion tree of bars. Each of the log n work levels lights segment by segment
 * and adds n operations; the last row holds the n unit leaves (base cases, no extra work).
 */
@Component({
  selector: 'app-divide-conquer-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './grid-viz.scss',
  styles: `
    .tree {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .level {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .bars {
      flex: 1;
      display: flex;
      gap: 3px;
    }
    .seg {
      height: 11px;
      flex-basis: 0;
      border-radius: 3px;
    }
    .seg.leaf.on {
      background: var(--cell);
      border-color: color-mix(in srgb, var(--viz-color) 70%, var(--cell-border));
    }
    .sum {
      width: 22px;
      text-align: right;
      transition: color 160ms ease;
    }
    .sum.full {
      color: color-mix(in srgb, var(--viz-color) 75%, var(--text-muted));
    }
  `,
  template: `
    <div class="viz col" role="img" [attr.aria-label]="ariaLabel()" [style.--viz-color]="color()">
      <div class="tree">
        @for (row of rows(); track row.level) {
          <div class="level">
            <div class="bars">
              @for (s of row.segments; track s.start) {
                <span
                  class="seg"
                  [class.on]="s.on"
                  [class.cur]="s.current"
                  [class.leaf]="row.leaf"
                  [style.flex-grow]="s.size"
                ></span>
              }
            </div>
            <span class="label sum" [class.full]="row.full">{{ row.leaf ? 'n×1' : '+' + n }}</span>
          </div>
        }
      </div>
      <div class="foot">
        <span class="label">{{ vizLabel }}</span>
        <span class="label">{{ progress() }}</span>
      </div>
    </div>
  `,
})
export class DivideConquerViz implements PatternViz {
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();

  readonly n = PATTERN.vizN;
  readonly vizLabel = PATTERN.vizLabel;
  readonly cost = costFor(PATTERN.id, this.n);
  readonly cycleLength = dcCycleLength(this.n);

  private readonly frame = computed(() => dcFrame(this.step(), this.n));

  protected readonly rows = computed(() => {
    const f = this.frame();
    return f.levels.map((segments, level) => ({
      level,
      segments,
      leaf: level === f.workLevels,
      full: segments.every((s) => s.on),
    }));
  });

  protected readonly progress = computed(() => {
    const f = this.frame();
    if (f.done) return `${f.workLevels} × ${this.n} = ${this.cost}`;
    if (f.level < 0) return `n = ${this.n}`;
    return `level ${f.level + 1}/${f.workLevels}`;
  });

  protected readonly ariaLabel = computed(() => {
    const f = this.frame();
    const total = `${f.ops} of ${this.cost} operations`;
    if (f.done) return `${PATTERN.title}: complete, ${f.workLevels} levels of ${this.n} work, ${total}`;
    if (f.level < 0) return `${PATTERN.title}: ready, input of ${this.n}, ${total}`;
    return `${PATTERN.title}: working on level ${f.level + 1} of ${f.workLevels}, ${total}`;
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
