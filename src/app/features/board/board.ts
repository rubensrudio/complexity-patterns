import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AnimationClock } from '../../core/animation-clock';
import { PATTERNS } from '../../core/patterns.data';
import { BoardControls } from './board-controls';
import { PatternRow } from './pattern-row';

/** The 10-pattern board: header, one row per pattern and the animation controls. */
@Component({
  selector: 'app-board',
  imports: [BoardControls, PatternRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    tabindex: '0',
    role: 'region',
    'aria-label': 'Complexity patterns board',
    '(keydown)': 'onKeydown($event)',
  },
  template: `
    <app-board-controls class="controls" />
    <div class="header" aria-hidden="true">
      <span>Pattern</span><span>Visualization</span><span>Big-O</span>
    </div>
    <div class="rows" role="list">
      @for (p of patterns; track p.id) {
        <app-pattern-row [pattern]="p" [step]="clock.tick()" />
      }
    </div>
  `,
  styleUrl: './board.scss',
})
export class Board {
  protected readonly clock = inject(AnimationClock);
  protected readonly patterns = PATTERNS;

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== ' ' && event.code !== 'Space') return;
    const target = event.target as HTMLElement | null;
    // Let focused buttons / form fields handle Space natively.
    if (target?.closest('button, input, select, textarea, a[href]')) return;
    event.preventDefault();
    this.clock.toggle();
  }
}
