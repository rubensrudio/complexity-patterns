import { OutputEmitterRef, effect, untracked } from '@angular/core';

/**
 * Emits `ops()` on `out` whenever its value changes. Call from an injection context
 * (component constructor or field initializer).
 */
export function emitOpsOnChange(ops: () => number, out: OutputEmitterRef<number>): void {
  let last: number | undefined;
  effect(() => {
    const value = ops();
    if (value === last) return;
    last = value;
    untracked(() => out.emit(value));
  });
}
