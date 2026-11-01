import { Type, reflectComponentType } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { costFor } from '../../../core/complexity';
import { PATTERNS } from '../../../core/patterns.data';
import { PatternId, PatternViz } from '../../../core/patterns.model';
import { DivideConquerViz } from './divide-conquer-viz';
import { LoopBinarySearchViz } from './loop-binary-search-viz';
import { NestedLoopViz } from './nested-loop-viz';
import { TriangularLoopViz } from './triangular-loop-viz';

type GridViz = PatternViz & { readonly cycleLength: number };

const CASES: { id: PatternId; cmp: Type<GridViz>; selector: string }[] = [
  { id: 'loop-binary-search', cmp: LoopBinarySearchViz, selector: 'app-loop-binary-search-viz' },
  { id: 'divide-conquer', cmp: DivideConquerViz, selector: 'app-divide-conquer-viz' },
  { id: 'nested-loop', cmp: NestedLoopViz, selector: 'app-nested-loop-viz' },
  { id: 'triangular-loop', cmp: TriangularLoopViz, selector: 'app-triangular-loop-viz' },
];

describe.each(CASES)('$id viz component', ({ id, cmp, selector }) => {
  let fixture: ComponentFixture<GridViz>;
  const n = PATTERNS.find((p) => p.id === id)!.vizN;

  async function at(step: number): Promise<HTMLElement> {
    fixture.componentRef.setInput('step', step);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  const root = () => (fixture.nativeElement as HTMLElement).querySelector('[role="img"]') as HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(cmp);
    fixture.componentRef.setInput('color', 'red');
    await at(0);
  });

  it('keeps its selector', () => {
    expect(reflectComponentType(cmp)?.selector).toBe(selector);
  });

  it('R1: same step (mod cycleLength) renders the same DOM and loops', async () => {
    const len = fixture.componentInstance.cycleLength;
    expect(len).toBeGreaterThan(costFor(id, n) > 0 ? 2 : 1);
    for (const k of [0, 1, Math.floor(len / 2), len - 1]) {
      const a = (await at(k)).innerHTML;
      const b = (await at(k + len)).innerHTML;
      const c = (await at(k + 5 * len)).innerHTML;
      expect(b).toBe(a);
      expect(c).toBe(a);
    }
  });

  it('R2: opsChange starts at 0, is monotonic within a cycle, ends at costFor and only emits on change', async () => {
    const fresh = TestBed.createComponent(cmp);
    const emitted: number[] = [];
    fresh.componentInstance.opsChange.subscribe((v) => emitted.push(v));
    fresh.componentRef.setInput('color', 'red');
    const len = fresh.componentInstance.cycleLength;
    const cost = costFor(id, n);
    const cycles: number[][] = [];
    for (let s = 0; s < 2 * len; s++) {
      const before = emitted.length;
      fresh.componentRef.setInput('step', s);
      await fresh.whenStable();
      if (s % len === 0) cycles.push([]);
      cycles[cycles.length - 1].push(...emitted.slice(before));
    }
    expect(emitted[0]).toBe(0);
    for (let i = 1; i < emitted.length; i++) expect(emitted[i]).not.toBe(emitted[i - 1]);
    expect(cycles).toHaveLength(2);
    for (const c of cycles) {
      expect(c[0]).toBe(0);
      for (let i = 1; i < c.length; i++) expect(c[i]).toBeGreaterThan(c[i - 1]);
      expect(c[c.length - 1]).toBe(cost);
    }
  });

  it('R3: root has role="img" and an aria-label describing the current state', async () => {
    const len = fixture.componentInstance.cycleLength;
    const start = root().getAttribute('aria-label');
    expect(start).toBeTruthy();
    await at(Math.floor(len / 2));
    const mid = root().getAttribute('aria-label');
    expect(mid).toBeTruthy();
    expect(mid).not.toBe(start);
    await at(len - 1);
    expect(root().getAttribute('aria-label')).toContain(String(costFor(id, n)));
  });

  it('R4: active elements use the color input, inactive ones stay neutral', async () => {
    const len = fixture.componentInstance.cycleLength;
    expect(root().style.getPropertyValue('--viz-color')).toBe('red');
    const el = await at(0);
    expect(el.querySelectorAll('.on').length).toBe(0);
    expect(el.querySelectorAll('.cell, .seg').length).toBeGreaterThan(0);
    const mid = await at(Math.floor(len / 2));
    const on = mid.querySelectorAll('.on').length;
    expect(on).toBeGreaterThan(0);
    expect(mid.querySelectorAll('.cell:not(.on), .seg:not(.on)').length).toBeGreaterThan(0);
    fixture.componentRef.setInput('color', 'blue');
    await fixture.whenStable();
    expect(root().style.getPropertyValue('--viz-color')).toBe('blue');
  });
});

describe('grid viz specifics', () => {
  it('nested loop lights k cells at step k with a single current cell', async () => {
    const f = TestBed.createComponent(NestedLoopViz);
    f.componentRef.setInput('color', 'red');
    f.componentRef.setInput('step', 13);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.cell').length).toBe(36);
    expect(el.querySelectorAll('.cell.on').length).toBe(13);
    expect(el.querySelectorAll('.cell.cur').length).toBe(1);
    expect(el.textContent).toContain('n rows × n cols');
  });

  it('triangular loop never lights the diagonal or the upper triangle', async () => {
    const f = TestBed.createComponent(TriangularLoopViz);
    f.componentRef.setInput('color', 'red');
    const len = f.componentInstance.cycleLength;
    f.componentRef.setInput('step', len - 1);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelectorAll('.cell.on').length).toBe(15);
    expect(el.querySelectorAll('.cell.diag').length).toBe(6);
    expect(el.querySelectorAll('.cell.diag.on, .cell.upper.on').length).toBe(0);
    expect(el.textContent).toContain('half the grid');
  });

  it('loop + binary search shows the label and a ✓ when an element is found', async () => {
    const f = TestBed.createComponent(LoopBinarySearchViz);
    f.componentRef.setInput('color', 'red');
    f.componentRef.setInput('step', 4);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.textContent).toContain('log n search per element');
    expect(el.textContent).toContain('✓');
    expect(el.querySelectorAll('.top .cell').length).toBe(10);
  });

  it('divide & conquer renders 1/2/4/8 segments and its label', async () => {
    const f = TestBed.createComponent(DivideConquerViz);
    f.componentRef.setInput('color', 'red');
    f.componentRef.setInput('step', 0);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    const rows = Array.from(el.querySelectorAll('.level')).map((r) => r.querySelectorAll('.seg').length);
    expect(rows).toEqual([1, 2, 4, 8]);
    expect(el.textContent).toContain('each level = n work');
  });
});
