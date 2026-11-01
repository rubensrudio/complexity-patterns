import { Injectable, OnDestroy, signal } from '@angular/core';

export const CLOCK_SPEEDS = [0.5, 1, 2, 4] as const;
export type ClockSpeed = (typeof CLOCK_SPEEDS)[number];
/** Milliseconds between ticks at speed 1. */
export const BASE_INTERVAL_MS = 350;

/** Single global tick that drives every visualization. */
@Injectable({ providedIn: 'root' })
export class AnimationClock implements OnDestroy {
  private readonly _tick = signal(0);
  private readonly _playing = signal(false);
  private readonly _speed = signal<ClockSpeed>(1);
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly tick = this._tick.asReadonly();
  readonly playing = this._playing.asReadonly();
  readonly speed = this._speed.asReadonly();

  constructor() {
    const reduce =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) this.play();
  }

  play(): void {
    if (this._playing()) return;
    this._playing.set(true);
    this.schedule();
  }

  pause(): void {
    this._playing.set(false);
    this.clear();
  }

  toggle(): void {
    if (this._playing()) this.pause();
    else this.play();
  }

  /** Advance exactly one tick (useful while paused). */
  stepOnce(): void {
    this._tick.update((t) => t + 1);
  }

  reset(): void {
    this._tick.set(0);
  }

  /** Throws RangeError for a speed outside CLOCK_SPEEDS. */
  setSpeed(speed: number): void {
    if (!(CLOCK_SPEEDS as readonly number[]).includes(speed)) {
      throw new RangeError(`unsupported speed: ${speed}`);
    }
    this._speed.set(speed as ClockSpeed);
    if (this._playing()) {
      this.clear();
      this.schedule();
    }
  }

  ngOnDestroy(): void {
    this.clear();
  }

  private schedule(): void {
    this.timer = setTimeout(() => {
      this._tick.update((t) => t + 1);
      if (this._playing()) this.schedule();
    }, BASE_INTERVAL_MS / this._speed());
  }

  private clear(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
