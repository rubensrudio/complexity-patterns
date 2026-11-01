import { TestBed } from '@angular/core/testing';
import { AnimationClock, BASE_INTERVAL_MS } from './animation-clock';

describe('AnimationClock', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('ticks while playing and stops on pause', () => {
    const c = TestBed.inject(AnimationClock);
    c.reset();
    c.play();
    vi.advanceTimersByTime(BASE_INTERVAL_MS * 3);
    expect(c.tick()).toBe(3);
    c.pause();
    vi.advanceTimersByTime(BASE_INTERVAL_MS * 3);
    expect(c.tick()).toBe(3);
    c.stepOnce();
    expect(c.tick()).toBe(4);
    c.reset();
    expect(c.tick()).toBe(0);
  });

  it('speeds up and rejects unknown speeds', () => {
    const c = TestBed.inject(AnimationClock);
    c.pause();
    c.reset();
    c.setSpeed(2);
    c.play();
    vi.advanceTimersByTime(BASE_INTERVAL_MS * 2);
    expect(c.tick()).toBe(4);
    expect(() => c.setSpeed(3)).toThrow(RangeError);
    c.pause();
  });
});
