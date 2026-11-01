import { TestBed } from '@angular/core/testing';
import { PermutationsViz, PERMUTATIONS_CYCLE_LENGTH } from './permutations-viz';
import { costFor } from '../../../core/complexity';
import { PATTERNS } from '../../../core/patterns.data';

const def = PATTERNS.find((p) => p.id === 'permutations')!;
const TOTAL = costFor(def.id, def.vizN);

async function create(step = 0, color = 'red') {
  const fixture = TestBed.createComponent(PermutationsViz);
  const emitted: number[] = [];
  fixture.componentInstance.opsChange.subscribe((v) => emitted.push(v));
  fixture.componentRef.setInput('color', color);
  fixture.componentRef.setInput('step', step);
  await fixture.whenStable();
  return { fixture, emitted, el: fixture.nativeElement as HTMLElement };
}

async function setStep(fixture: Awaited<ReturnType<typeof create>>['fixture'], step: number) {
  fixture.componentRef.setInput('step', step);
  await fixture.whenStable();
}

function snapshot(el: HTMLElement): string {
  const nodes = Array.from(el.querySelectorAll('[data-node]')).map(
    (n) => `${n.getAttribute('class')}|${n.getAttribute('fill')}`,
  );
  return `${el.getAttribute('aria-label')}::${el.querySelector('[data-current]')?.textContent}::${nodes.join(',')}`;
}

describe('PermutationsViz', () => {
  it('R1: frame is a pure function of step and loops', async () => {
    const { fixture, el } = await create(0);
    expect(PERMUTATIONS_CYCLE_LENGTH).toBeGreaterThan(TOTAL);
    const first: string[] = [];
    for (let s = 0; s < PERMUTATIONS_CYCLE_LENGTH; s++) {
      await setStep(fixture, s);
      first.push(snapshot(el));
    }
    for (let s = 0; s < PERMUTATIONS_CYCLE_LENGTH; s++) {
      await setStep(fixture, s + PERMUTATIONS_CYCLE_LENGTH * 5);
      expect(snapshot(el)).toBe(first[s]);
    }
    expect(new Set(first).size).toBeGreaterThan(TOTAL);
  });

  it('renders the permutation tree 1 → 4 → 12 → 24', async () => {
    const { el } = await create(0);
    const perLevel = (d: number) => el.querySelectorAll(`[data-level="${d}"]`).length;
    expect([0, 1, 2, 3].map(perLevel)).toEqual([1, 4, 12, 24]);
  });

  it('walks leaves depth-first in lexicographic order and shows the current permutation', async () => {
    const { fixture, el } = await create(1);
    const current = () => el.querySelector('[data-current]')!.textContent!.trim();
    expect(current()).toBe('A B C D');
    await setStep(fixture, 2);
    expect(current()).toBe('A B D C');
    await setStep(fixture, 7);
    expect(current()).toBe('B A C D');
    await setStep(fixture, TOTAL);
    expect(current()).toBe('D C B A');
    const active = el.querySelectorAll('[data-node].active');
    // active path: root, D, D-C, leaf
    expect(Array.from(active).map((n) => n.getAttribute('data-level'))).toEqual(['0', '1', '2', '3']);
  });

  it('R2: opsChange counts generated permutations 0 → costFor, only on change', async () => {
    const { fixture, emitted } = await create(0);
    for (let s = 1; s < PERMUTATIONS_CYCLE_LENGTH * 2; s++) await setStep(fixture, s);
    const cycle = Array.from({ length: TOTAL + 1 }, (_, i) => i);
    expect(emitted).toEqual([...cycle, ...cycle]);
  });

  it('R2: holds exactly costFor at the end of the cycle', async () => {
    const { emitted } = await create(PERMUTATIONS_CYCLE_LENGTH - 1);
    expect(emitted).toEqual([TOTAL]);
  });

  it('R3: root has role img and an aria-label describing the state', async () => {
    const { fixture, el } = await create(0);
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toMatch(/0 of 24/);
    await setStep(fixture, 7);
    expect(el.getAttribute('aria-label')).toMatch(/7 of 24.*B A C D/);
    await setStep(fixture, PERMUTATIONS_CYCLE_LENGTH - 1);
    expect(el.getAttribute('aria-label')).toMatch(/all 24/);
  });

  it('R4: visited elements use color, others use cell tokens', async () => {
    const { el } = await create(3, 'red');
    const leaves = Array.from(el.querySelectorAll('[data-level="3"]'));
    const on = leaves.filter((n) => n.classList.contains('on'));
    expect(on.length).toBe(3);
    for (const n of on) expect(n.getAttribute('fill')).toBe('red');
    for (const n of leaves.filter((n) => !n.classList.contains('on'))) {
      expect(n.getAttribute('fill')).toBe('var(--cell)');
      expect(n.getAttribute('stroke')).toBe('var(--cell-border)');
    }
    const firstLevel = Array.from(el.querySelectorAll('[data-level="1"]'));
    expect(firstLevel.map((n) => n.classList.contains('on'))).toEqual([true, false, false, false]);
    expect(firstLevel[0].getAttribute('stroke')).toBe('red');
    expect(firstLevel[1].getAttribute('stroke')).toBe('var(--cell-border)');
  });
});
