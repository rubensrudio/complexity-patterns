import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AnimationClock, CLOCK_SPEEDS } from '../../core/animation-clock';

/** Play/pause, step, reset and speed buttons bound to the global AnimationClock. */
@Component({
  selector: 'app-board-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'toolbar', 'aria-label': 'Animation controls' },
  template: `
    <button type="button" class="ctl play" [attr.aria-pressed]="clock.playing()" (click)="clock.toggle()">
      {{ clock.playing() ? 'Pause' : 'Play' }}
    </button>
    <button type="button" class="ctl" (click)="clock.stepOnce()">Step</button>
    <button type="button" class="ctl" (click)="clock.reset()">Reset</button>
    <span class="speeds" role="group" aria-label="Speed">
      @for (s of speeds; track s) {
        <button type="button" class="ctl speed" [attr.aria-pressed]="clock.speed() === s" (click)="clock.setSpeed(s)">{{ s }}×</button>
      }
    </span>
    <span class="hint">Space: play / pause</span>
  `,
  styles: `
    :host { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .speeds { display: inline-flex; gap: 4px; margin-left: 8px; }
    .ctl {
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      color: var(--text);
      font-size: 0.85rem;
      cursor: pointer;
    }
    .ctl:hover { border-color: var(--cell-border); color: var(--text-strong); }
    .ctl:focus-visible { outline: 2px solid var(--code-fn); outline-offset: 2px; }
    .ctl[aria-pressed='true'] { color: var(--text-strong); border-color: var(--text-muted); background: var(--cell); }
    .play { min-width: 5.5em; }
    .hint { margin-left: auto; font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono); }
  `,
})
export class BoardControls {
  protected readonly clock = inject(AnimationClock);
  protected readonly speeds = CLOCK_SPEEDS;
}
