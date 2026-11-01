import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PATTERNS } from '../../../core/patterns.data';
import { PatternViz } from '../../../core/patterns.model';
import { emitOpsOnChange } from './emit-ops';
import { singleFrame } from './linear-frames';

const N = PATTERNS.find((p) => p.id === 'single-loop')!.vizN;

/** O(n): a cursor touches each cell once, left to right. */
@Component({
  selector: 'app-single-loop-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './linear-viz.scss',
  template: `
    @let f = frame();
    <div class="viz" role="img" [attr.aria-label]="label()" [style.--c]="color()">
      <div class="lane">
        <span class="pointer" [style.left.%]="cursorLeft()" [style.opacity]="f.cursor < 0 ? 0 : 1">▼</span>
      </div>
      <div class="row">
        @for (i of indices; track i) {
          <div
            class="cell"
            [class.on]="i < f.visited"
            [class.cur]="i === f.cursor"
            [style.border-color]="i < f.visited ? color() : 'var(--cell-border)'"
          ></div>
        }
      </div>
      <div class="foot">
        <span class="lbl">i = <b>{{ f.cursor < 0 ? '–' : f.cursor }}</b></span>
        <span class="lbl">{{ f.visited }} / {{ f.size }}</span>
      </div>
    </div>
  `,
})
export class SingleLoopViz implements PatternViz {
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();

  protected readonly indices = Array.from({ length: N }, (_, i) => i);
  protected readonly frame = computed(() => singleFrame(this.step(), N));
  protected readonly cursorLeft = computed(() => ((Math.max(0, this.frame().cursor) + 0.5) / N) * 100);
  protected readonly label = computed(() => {
    const f = this.frame();
    if (f.cursor < 0) return `Single loop: ready, 0 of ${f.size} visited`;
    if (f.visited === f.size) return `Single loop: all ${f.size} elements visited`;
    return `Single loop: visiting index ${f.cursor} of ${f.size}`;
  });

  constructor() {
    emitOpsOnChange(() => this.frame().ops, this.opsChange);
  }
}
