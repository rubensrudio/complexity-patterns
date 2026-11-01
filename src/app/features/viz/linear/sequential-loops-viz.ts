import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { secondSize } from '../../../core/complexity';
import { PATTERNS } from '../../../core/patterns.data';
import { PatternViz } from '../../../core/patterns.model';
import { emitOpsOnChange } from './emit-ops';
import { sequentialFrame } from './linear-frames';

const N = PATTERNS.find((p) => p.id === 'sequential-loops')!.vizN;
const M = secondSize(N);

/** O(n + m): one full pass over row n, then one over row m. */
@Component({
  selector: 'app-sequential-loops-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './linear-viz.scss',
  styles: `
    .viz { gap: 8px; }
    .line {
      display: grid;
      grid-template-columns: 16px repeat(var(--cols), minmax(0, 1fr));
      gap: 4px;
      align-items: center;
    }
    .line .cell { height: 20px; }
    .name { text-align: left; transition: color 0.22s ease; }
    .name.live { color: var(--c); }
    .foot { padding-left: 20px; box-sizing: border-box; }
  `,
  template: `
    @let f = frame();
    <div class="viz" role="img" [attr.aria-label]="label()" [style.--c]="color()" [style.--cols]="cols">
      <div class="line">
        <span class="lbl name" [class.live]="f.row === 'n'">n</span>
        @for (i of nIdx; track i) {
          <div
            class="cell"
            [class.on]="i < f.visitedN"
            [class.cur]="f.row === 'n' && i === f.cursor"
            [style.border-color]="i < f.visitedN ? color() : 'var(--cell-border)'"
          ></div>
        }
      </div>
      <div class="line">
        <span class="lbl name" [class.live]="f.row === 'm'">m</span>
        @for (j of mIdx; track j) {
          <div
            class="cell"
            [class.on]="j < f.visitedM"
            [class.cur]="f.row === 'm' && j === f.cursor"
            [style.border-color]="j < f.visitedM ? color() : 'var(--cell-border)'"
          ></div>
        }
      </div>
      <div class="foot">
        <span class="lbl">i = <b>{{ f.visitedN }}</b> / {{ f.n }}</span>
        <span class="lbl">j = <b>{{ f.visitedM }}</b> / {{ f.m }}</span>
      </div>
    </div>
  `,
})
export class SequentialLoopsViz implements PatternViz {
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();

  protected readonly cols = Math.max(N, M);
  protected readonly nIdx = Array.from({ length: N }, (_, i) => i);
  protected readonly mIdx = Array.from({ length: M }, (_, i) => i);
  protected readonly frame = computed(() => sequentialFrame(this.step(), N));
  protected readonly label = computed(() => {
    const f = this.frame();
    if (f.row === null) return `Sequential loops: ready, n = ${f.n}, m = ${f.m}`;
    if (f.visitedM === f.m) return `Sequential loops: done, ${f.n} + ${f.m} = ${f.n + f.m} steps`;
    if (f.row === 'n') return `Sequential loops: first loop, index ${f.cursor} of ${f.n}`;
    return `Sequential loops: second loop, index ${f.cursor} of ${f.m} (first loop of ${f.n} done)`;
  });

  constructor() {
    emitOpsOnChange(() => this.frame().ops, this.opsChange);
  }
}
