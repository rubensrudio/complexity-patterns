import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PATTERNS } from '../../../core/patterns.data';
import { PatternViz } from '../../../core/patterns.model';
import { emitOpsOnChange } from './emit-ops';
import { halvingFrame } from './linear-frames';

const N = PATTERNS.find((p) => p.id === 'halving-loop')!.vizN;

/** O(log n): the active span of a bar shrinks by half each step. */
@Component({
  selector: 'app-halving-loop-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './linear-viz.scss',
  styles: `
    .meta {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .value {
      font-size: 13px;
      color: var(--c);
      text-shadow: 0 0 10px color-mix(in srgb, var(--c) 45%, transparent);
    }
    .bar {
      position: relative;
      height: 24px;
      width: 100%;
    }
    .bar .cell {
      position: absolute;
      inset: 0 auto 0 0;
      height: 100%;
    }
    .track { width: 100%; }
    .span {
      min-width: 6px;
      transition:
        width 0.3s ease,
        box-shadow 0.22s ease;
      box-shadow: 0 0 12px color-mix(in srgb, var(--c) 45%, transparent);
    }
    .mark {
      position: absolute;
      top: -3px;
      bottom: -3px;
      width: 0;
      border-left: 1px dashed var(--cell-border);
      transition: border-color 0.22s ease;
    }
    .mark.passed { border-left-color: color-mix(in srgb, var(--c) 55%, transparent); }
  `,
  template: `
    @let f = frame();
    <div class="viz" role="img" [attr.aria-label]="label()" [style.--c]="color()">
      <div class="meta">
        <span class="lbl"><b>{{ f.steps }}</b> {{ f.steps === 1 ? 'step' : 'steps' }}</span>
        <span class="value">{{ f.value }}</span>
      </div>
      <div class="bar">
        <div class="cell track"></div>
        <div class="cell on span" [style.width.%]="spanWidth()" [style.border-color]="color()"></div>
        @for (m of marks; track m.k) {
          <div class="mark" [class.passed]="m.k <= f.steps" [style.left.%]="m.left"></div>
        }
      </div>
      <div class="foot">
        <span class="lbl">n = {{ f.n }}</span>
        <span class="lbl">while (n &gt; 1) n /= 2</span>
      </div>
    </div>
  `,
})
export class HalvingLoopViz implements PatternViz {
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();

  /** Dashed marks at each halving boundary (n/2, n/4, ...). */
  protected readonly marks = Array.from({ length: halvingFrame(Number.MAX_SAFE_INTEGER, N).total }, (_, i) => ({
    k: i + 1,
    left: (Math.max(1, Math.ceil(N / 2 ** (i + 1))) / N) * 100,
  }));
  protected readonly frame = computed(() => halvingFrame(this.step(), N));
  protected readonly spanWidth = computed(() => (this.frame().value / N) * 100);
  protected readonly label = computed(() => {
    const f = this.frame();
    return `Halving loop: n = ${f.value} after ${f.steps} of ${f.total} steps, starting from ${f.n}`;
  });

  constructor() {
    emitOpsOnChange(() => this.frame().ops, this.opsChange);
  }
}
