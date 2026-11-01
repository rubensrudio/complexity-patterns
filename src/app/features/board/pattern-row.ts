import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { costFor } from '../../core/complexity';
import { PatternDef, toneVar } from '../../core/patterns.model';
import { highlight } from './code-highlight';
import { BOARD_VIZ_REGISTRY, VizHost } from './viz-host';

/** One board row: code (PATTERN), animation + op counter (VISUALIZATION), Big-O. */
@Component({
  selector: 'app-pattern-row',
  imports: [VizHost],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'row',
    role: 'listitem',
    '[style.--row-tone]': 'tone()',
  },
  template: `
    <div class="cell pattern">
      <h3 class="title">{{ pattern().index }}. {{ pattern().title }}</h3>
      <pre class="code"><code>@for (line of lines(); track $index) {<span class="code-line">@for (tok of line; track $index) {<span [class]="'tok-' + tok.kind">{{ tok.text }}</span>}</span>}</code></pre>
    </div>
    <div class="cell viz">
      <div class="viz-frame">
        <ng-container [appVizHost]="vizType()" [step]="step()" [color]="tone()" (opsChange)="ops.set($event)" />
      </div>
      <p class="ops" aria-live="off">ops: {{ ops() }} / {{ total() }}</p>
    </div>
    <div class="cell complexity">
      <p class="big-o">{{ pattern().bigO }}</p>
      <p class="caption">{{ pattern().caption }}</p>
    </div>
  `,
  styleUrl: './pattern-row.scss',
})
export class PatternRow {
  readonly pattern = input.required<PatternDef>();
  readonly step = input.required<number>();

  private readonly registry = inject(BOARD_VIZ_REGISTRY);

  protected readonly ops = signal(0);
  protected readonly tone = computed(() => toneVar(this.pattern().tone));
  protected readonly total = computed(() => costFor(this.pattern().id, this.pattern().vizN));
  protected readonly lines = computed(() => this.pattern().code.map(highlight));
  protected readonly vizType = computed(() => this.registry[this.pattern().id]);
}
