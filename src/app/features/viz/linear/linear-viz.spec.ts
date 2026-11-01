import { Type, reflectComponentType } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { costFor } from '../../../core/complexity';
import { PATTERNS } from '../../../core/patterns.data';
import { PatternId, PatternViz } from '../../../core/patterns.model';
import { HalvingLoopViz } from './halving-loop-viz';
import { HashLookupViz } from './hash-lookup-viz';
import { halvingCycle, hashCycle, sequentialCycle, singleCycle } from './linear-frames';
import { SequentialLoopsViz } from './sequential-loops-viz';
import { SingleLoopViz } from './single-loop-viz';

interface Case {
  id: PatternId;
  type: Type<PatternViz>;
  selector: string;
  cycle: (n: number) => number;
}

const CASES: Case[] = [
  { id: 'hash-lookup', type: HashLookupViz, selector: 'app-hash-lookup-viz', cycle: hashCycle },
  { id: 'halving-loop', type: HalvingLoopViz, selector: 'app-halving-loop-viz', cycle: halvingCycle },
  { id: 'single-loop', type: SingleLoopViz, selector: 'app-single-loop-viz', cycle: singleCycle },
  { id: 'sequential-loops', type: SequentialLoopsViz, selector: 'app-sequential-loops-viz', cycle: sequentialCycle },
];

async function mount(c: Case, step = 0, color = 'red') {
  const fixture = TestBed.createComponent(c.type);
  const emitted: number[] = [];
  fixture.componentInstance.opsChange.subscribe((v) => emitted.push(v));
  fixture.componentRef.setInput('step', step);
  fixture.componentRef.setInput('color', color);
  await fixture.whenStable();
  return { fixture, emitted };
}

async function go(fixture: ComponentFixture<PatternViz>, step: number) {
  fixture.componentRef.setInput('step', step);
  await fixture.whenStable();
}

const root = (f: ComponentFixture<unknown>) =>
  (f.nativeElement as HTMLElement).querySelector('[role="img"]') as HTMLElement;

describe('linear visualizations', () => {
  for (const c of CASES) {
    describe(c.id, () => {
      const n = PATTERNS.find((p) => p.id === c.id)!.vizN;
      const len = c.cycle(n);
      const cost = costFor(c.id, n);

      it('keeps the registry selector', () => {
        expect(reflectComponentType(c.type)?.selector).toBe(c.selector);
      });

      it('R1: same step renders the same state, and loops', async () => {
        const { fixture } = await mount(c, 3);
        const a = root(fixture).outerHTML;
        await go(fixture, 4);
        await go(fixture, 3);
        expect(root(fixture).outerHTML).toBe(a);
        // hash lookup picks a new bucket every cycle; it repeats after n cycles
        const period = c.id === 'hash-lookup' ? len * n : len;
        await go(fixture, 3 + period);
        expect(root(fixture).outerHTML).toBe(a);
        await go(fixture, 3 + 3 * period);
        expect(root(fixture).outerHTML).toBe(a);
      });

      it('R2: emits 0 at each cycle start, monotonic, ends at costFor, only on change', async () => {
        const { fixture, emitted } = await mount(c, 0);
        const cycles: number[][] = [];
        for (let k = 0; k < 2; k++) {
          const start = emitted.length;
          for (let s = k === 0 ? 1 : 0; s < len; s++) await go(fixture, k * len + s);
          cycles.push(emitted.slice(k === 0 ? 0 : start));
        }
        for (const seq of cycles) {
          expect(seq[0]).toBe(0);
          expect(seq[seq.length - 1]).toBe(cost);
          for (let i = 1; i < seq.length; i++) expect(seq[i]).toBeGreaterThan(seq[i - 1]);
        }
        const before = emitted.length;
        await go(fixture, len * 2 - 1); // already at hold value
        expect(emitted.length).toBe(before);
      });

      it('R3: root has role img and an aria-label describing the state', async () => {
        const { fixture } = await mount(c, 0);
        const first = root(fixture).getAttribute('aria-label');
        expect(first).toBeTruthy();
        await go(fixture, 1);
        const second = root(fixture).getAttribute('aria-label');
        expect(second).toBeTruthy();
        expect(second).not.toBe(first);
        await go(fixture, len - 1);
        expect(root(fixture).getAttribute('aria-label')).toContain(String(n));
      });

      it('R4: active elements use the color input, inactive ones do not', async () => {
        const { fixture } = await mount(c, 1, 'red');
        const el = fixture.nativeElement as HTMLElement;
        const on = Array.from(el.querySelectorAll<HTMLElement>('.cell.on'));
        const off = Array.from(el.querySelectorAll<HTMLElement>('.cell:not(.on)'));
        expect(on.length).toBeGreaterThan(0);
        expect(off.length).toBeGreaterThan(0);
        for (const e of on) expect(e.style.borderColor).toBe('red');
        for (const e of off) expect(['', 'var(--cell-border)']).toContain(e.style.borderColor);
        expect(root(fixture).style.getPropertyValue('--c')).toBe('red');
      });
    });
  }
});
