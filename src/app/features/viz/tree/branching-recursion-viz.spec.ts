import { TestBed } from '@angular/core/testing';
import { BranchingRecursionViz, BRANCHING_CYCLE_LENGTH } from './branching-recursion-viz';
import { costFor } from '../../../core/complexity';
import { PATTERNS } from '../../../core/patterns.data';

const def = PATTERNS.find((p) => p.id === 'branching-recursion')!;
const TOTAL = costFor(def.id, def.vizN);

async function create(step = 0, color = 'red') {
  const fixture = TestBed.createComponent(BranchingRecursionViz);
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
    (n) => `${n.getAttribute('class')}|${n.getAttribute('fill')}|${n.getAttribute('stroke')}`,
  );
  return `${el.getAttribute('aria-label')}::${nodes.join(',')}`;
}

describe('BranchingRecursionViz', () => {
  it('R1: frame is a pure function of step and loops', async () => {
    const { fixture, el } = await create(0);
    expect(BRANCHING_CYCLE_LENGTH).toBeGreaterThan(TOTAL);
    const first: string[] = [];
    for (let s = 0; s < BRANCHING_CYCLE_LENGTH; s++) {
      await setStep(fixture, s);
      first.push(snapshot(el));
    }
    for (let s = 0; s < BRANCHING_CYCLE_LENGTH; s++) {
      await setStep(fixture, s + BRANCHING_CYCLE_LENGTH * 3);
      expect(snapshot(el)).toBe(first[s]);
    }
    expect(new Set(first).size).toBeGreaterThan(TOTAL);
  });

  it('renders a full binary tree with 2^n - 1 nodes and level counts', async () => {
    const { el } = await create(0);
    expect(el.querySelectorAll('[data-node]').length).toBe(TOTAL);
    const counts = Array.from(el.querySelectorAll('[data-level-count]')).map((t) => t.textContent?.trim());
    expect(counts).toEqual(Array.from({ length: def.vizN }, (_, d) => String(2 ** d)));
  });

  it('lights nodes in pre-order (depth-first)', async () => {
    const { fixture, el } = await create(0);
    const order: string[] = [];
    for (let s = 1; s <= TOTAL; s++) {
      await setStep(fixture, s);
      const active = el.querySelector('[data-node].active');
      order.push(active!.getAttribute('data-node')!);
    }
    // depth-first pre-order of a depth-4 tree: "d-i"
    expect(order.slice(0, 5)).toEqual(['0-0', '1-0', '2-0', '3-0', '3-1']);
    expect(order[TOTAL - 1]).toBe(`${def.vizN - 1}-${2 ** (def.vizN - 1) - 1}`);
    expect(new Set(order).size).toBe(TOTAL);
  });

  it('R2: opsChange goes 0 → costFor per cycle, monotonic, only on change', async () => {
    const { fixture, emitted } = await create(0);
    for (let s = 1; s < BRANCHING_CYCLE_LENGTH * 2; s++) await setStep(fixture, s);
    const cycle = Array.from({ length: TOTAL + 1 }, (_, i) => i);
    expect(emitted).toEqual([...cycle, ...cycle]);
    for (let i = 1; i < emitted.length; i++) expect(emitted[i]).not.toBe(emitted[i - 1]);
  });

  it('R2: holds exactly costFor at the end of the cycle', async () => {
    const { emitted } = await create(BRANCHING_CYCLE_LENGTH - 1);
    expect(emitted).toEqual([TOTAL]);
  });

  it('R3: root has role img and an aria-label describing the state', async () => {
    const { fixture, el } = await create(0);
    expect(el.getAttribute('role')).toBe('img');
    const start = el.getAttribute('aria-label');
    expect(start).toMatch(/0 of 15/);
    await setStep(fixture, 3);
    expect(el.getAttribute('aria-label')).toMatch(/call 3 of 15/);
    await setStep(fixture, BRANCHING_CYCLE_LENGTH - 1);
    expect(el.getAttribute('aria-label')).toMatch(/all 15 calls/);
  });

  it('R4: visited nodes use color, others use cell tokens', async () => {
    const { el } = await create(2, 'red');
    const nodes = Array.from(el.querySelectorAll('[data-node]'));
    const on = nodes.filter((n) => n.classList.contains('on'));
    const off = nodes.filter((n) => !n.classList.contains('on'));
    expect(on.length).toBe(2);
    for (const n of on) expect(n.getAttribute('stroke')).toBe('red');
    for (const n of on) expect(n.getAttribute('fill')).toBe('red');
    for (const n of off) {
      expect(n.getAttribute('fill')).toBe('var(--cell)');
      expect(n.getAttribute('stroke')).toBe('var(--cell-border)');
    }
    const litEdges = el.querySelectorAll('[data-edge].on');
    expect(litEdges.length).toBe(1);
    expect(litEdges[0].getAttribute('stroke')).toBe('red');
  });
});
