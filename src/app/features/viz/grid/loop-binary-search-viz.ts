import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { costFor } from '../../../core/complexity';
import { PatternViz } from '../../../core/patterns.model';
import { gridPattern, lbsCycleLength, lbsFrame } from './grid-frames';

const PATTERN = gridPattern('loop-binary-search');

/** O(n log n): the outer loop walks n elements; each one runs a log n binary search below. */
@Component({
  selector: 'app-loop-binary-search-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './grid-viz.scss',
  styles: `
    .top,
    .search {
      display: grid;
      grid-template-columns: repeat(var(--n), 1fr);
      gap: 4px;
    }
    .top .cell {
      height: 22px;
      border-radius: 4px;
    }
    .search-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .search {
      flex: 1;
      gap: 2px;
    }
    .search .cell {
      height: 8px;
      border-radius: 2px;
    }
    .search .cell:not(.on) {
      opacity: 0.45;
    }
    .check {
      width: 12px;
      font-family: var(--font-mono);
      font-size: 11px;
      line-height: 12px;
      color: var(--viz-color);
      text-shadow: 0 0 8px var(--viz-color);
    }
  `,
  template: `
    <div class="viz col" role="img" [attr.aria-label]="ariaLabel()" [style.--viz-color]="color()">
      <div class="top" [style.--n]="n">
        @for (c of elements(); track c.k) {
          <span class="cell" [class.on]="c.on" [class.cur]="c.cur"></span>
        }
      </div>
      <div class="search-row">
        <div class="search" [style.--n]="n">
          @for (c of interval(); track c.k) {
            <span class="cell" [class.on]="c.on" [class.cur]="c.cur"></span>
          }
        </div>
        <span class="check">
          @if (frame().found) {
            ✓
          }
        </span>
      </div>
      <div class="foot">
        <span class="label">{{ vizLabel }}</span>
        <span class="label">{{ progress() }}</span>
      </div>
    </div>
  `,
})
export class LoopBinarySearchViz implements PatternViz {
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();

  readonly n = PATTERN.vizN;
  readonly vizLabel = PATTERN.vizLabel;
  readonly cost = costFor(PATTERN.id, this.n);
  readonly cycleLength = lbsCycleLength(this.n);

  protected readonly frame = computed(() => lbsFrame(this.step(), this.n));

  protected readonly elements = computed(() => {
    const { element, done } = this.frame();
    return Array.from({ length: this.n }, (_, k) => ({
      k,
      on: done || (element >= 0 && k <= element),
      cur: !done && k === element,
    }));
  });

  protected readonly interval = computed(() => {
    const { element, lo, hi, mid, done } = this.frame();
    const active = element >= 0 && !done;
    return Array.from({ length: this.n }, (_, k) => ({
      k,
      on: active && k >= lo && k < hi,
      cur: active && k === mid,
    }));
  });

  protected readonly progress = computed(() => {
    const f = this.frame();
    if (f.done) return `${this.cost} ops`;
    if (f.element < 0) return `n = ${this.n}`;
    return `i ${f.element} · ${f.searchStep}/${f.searchSteps}`;
  });

  protected readonly ariaLabel = computed(() => {
    const f = this.frame();
    const total = `${f.ops} of ${this.cost} operations`;
    if (f.done) return `${PATTERN.title}: complete, ${this.n} searches, ${total}`;
    if (f.element < 0) return `${PATTERN.title}: ready, ${this.n} elements, ${total}`;
    const hit = f.found ? ', found' : '';
    return `${PATTERN.title}: element ${f.element + 1} of ${this.n}, search step ${f.searchStep} of ${f.searchSteps}${hit}, ${total}`;
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
