import { ChangeDetectionStrategy, Component, Type, input, output, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnimationClock, CLOCK_SPEEDS } from '../../core/animation-clock';
import { costFor } from '../../core/complexity';
import { PATTERNS } from '../../core/patterns.data';
import { PatternId, PatternViz } from '../../core/patterns.model';
import { Board } from './board';
import { BOARD_VIZ_REGISTRY } from './viz-host';

/** Fake viz: records the live instances so tests can read inputs and emit ops. */
const live: FakeViz[] = [];
let destroyed = 0;

@Component({
  selector: 'app-fake-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="fake">{{ step() }}|{{ color() }}</span>`,
})
class FakeViz implements PatternViz {
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();
  constructor() {
    live.push(this);
  }
  ngOnDestroy(): void {
    destroyed++;
  }
}

function fakeClock() {
  const tick = signal(0);
  const playing = signal(false);
  const speed = signal<number>(1);
  return {
    tick,
    playing,
    speed,
    play: vi.fn(() => playing.set(true)),
    pause: vi.fn(() => playing.set(false)),
    toggle: vi.fn(() => playing.update((p) => !p)),
    stepOnce: vi.fn(() => tick.update((t) => t + 1)),
    reset: vi.fn(() => tick.set(0)),
    setSpeed: vi.fn((s: number) => speed.set(s)),
  };
}

describe('Board', () => {
  let clock: ReturnType<typeof fakeClock>;
  let fixture: ComponentFixture<Board>;
  let el: HTMLElement;

  beforeEach(async () => {
    live.length = 0;
    destroyed = 0;
    clock = fakeClock();
    const registry = Object.fromEntries(PATTERNS.map((p) => [p.id, FakeViz])) as unknown as Record<PatternId, Type<PatternViz>>;
    await TestBed.configureTestingModule({
      imports: [Board],
      providers: [
        { provide: AnimationClock, useValue: clock },
        { provide: BOARD_VIZ_REGISTRY, useValue: registry },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Board);
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  const rows = () => Array.from(el.querySelectorAll<HTMLElement>('.row'));
  const button = (label: RegExp) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      label.test(b.textContent?.trim() ?? ''),
    )!;

  describe('R1 rows', () => {
    it('renders a header and 10 rows in PATTERNS order', () => {
      const header = el.querySelector('.header')!;
      expect(header.textContent).toContain('Pattern');
      expect(header.textContent).toContain('Visualization');
      expect(header.textContent).toContain('Big-O');
      expect(rows().length).toBe(10);
      rows().forEach((row, i) => {
        const p = PATTERNS[i];
        expect(row.querySelector('.title')!.textContent!.trim()).toBe(`${p.index}. ${p.title}`);
        const lines = Array.from(row.querySelectorAll('.code-line')).map((l) => l.textContent);
        expect(lines).toEqual([...p.code]);
        expect(row.querySelector('.big-o')!.textContent!.trim()).toBe(p.bigO);
        expect(row.querySelector('.caption')!.textContent!.trim()).toBe(p.caption);
      });
    });

    it('colors title and Big-O with the pattern tone', () => {
      const row = rows()[0] as HTMLElement;
      expect(row.style.getPropertyValue('--row-tone')).toBe('var(--tone-green)');
    });

    it('renders highlighted tokens in the code', () => {
      const row = rows()[2];
      expect(row.querySelector('.tok-keyword')!.textContent).toBe('for');
      expect(row.querySelector('.tok-number')!.textContent).toBe('0');
      expect(rows()[4].querySelector('.tok-fn')!.textContent).toBe('binarySearch');
    });
  });

  describe('R3 visualization + ops', () => {
    it('passes step and tone color to each viz', async () => {
      expect(live.length).toBe(10);
      expect(live[0].step()).toBe(0);
      expect(live[0].color()).toBe('var(--tone-green)');
      expect(live[9].color()).toBe('var(--tone-red)');
      clock.tick.set(7);
      await fixture.whenStable();
      expect(live.every((v) => v.step() === 7)).toBe(true);
      expect(rows()[0].querySelector('.fake')!.textContent).toBe('7|var(--tone-green)');
    });

    it('shows ops from opsChange over costFor(id, vizN)', async () => {
      const counter = (i: number) => rows()[i].querySelector('.ops')!.textContent!.trim();
      PATTERNS.forEach((p, i) => expect(counter(i)).toBe(`ops: 0 / ${costFor(p.id, p.vizN)}`));
      live[2].opsChange.emit(5);
      await fixture.whenStable();
      expect(counter(2)).toBe('ops: 5 / 12');
      expect(counter(3)).toBe('ops: 0 / 21');
    });

    it('destroys the viz components and their subscriptions on destroy', () => {
      const v = live[0];
      fixture.destroy();
      expect(destroyed).toBe(10);
      expect(() => v.opsChange.emit(3)).not.toThrow();
    });
  });

  describe('R4 controls', () => {
    it('play/pause reflects clock.playing', async () => {
      const play = el.querySelector<HTMLButtonElement>('.play')!;
      expect(play.textContent!.trim()).toBe('Play');
      expect(play.getAttribute('aria-pressed')).toBe('false');
      play.click();
      await fixture.whenStable();
      expect(clock.toggle).toHaveBeenCalledTimes(1);
      expect(play.textContent!.trim()).toBe('Pause');
      expect(play.getAttribute('aria-pressed')).toBe('true');
    });

    it('step and reset call the clock', () => {
      button(/^Step$/).click();
      expect(clock.stepOnce).toHaveBeenCalledTimes(1);
      button(/^Reset$/).click();
      expect(clock.reset).toHaveBeenCalledTimes(1);
    });

    it('renders one button per speed with the active one pressed', async () => {
      const speeds = Array.from(el.querySelectorAll<HTMLButtonElement>('.speed'));
      expect(speeds.map((b) => b.textContent!.trim())).toEqual(CLOCK_SPEEDS.map((s) => `${s}×`));
      expect(speeds.map((b) => b.getAttribute('aria-pressed'))).toEqual([
        'false', 'true', 'false', 'false',
      ]);
      speeds[3].click();
      await fixture.whenStable();
      expect(clock.setSpeed).toHaveBeenCalledWith(4);
      expect(speeds.map((b) => b.getAttribute('aria-pressed'))).toEqual([
        'false', 'false', 'false', 'true',
      ]);
    });

    it('Space on the board toggles play and prevents scrolling', () => {
      const host = el;
      expect(host.getAttribute('tabindex')).toBe('0');
      const ev = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, cancelable: true });
      host.dispatchEvent(ev);
      expect(clock.toggle).toHaveBeenCalledTimes(1);
      expect(ev.defaultPrevented).toBe(true);
    });

    it('Space on a focused button is left to the button', () => {
      const ev = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      button(/^Step$/).dispatchEvent(ev);
      expect(clock.toggle).not.toHaveBeenCalled();
    });
  });
});
