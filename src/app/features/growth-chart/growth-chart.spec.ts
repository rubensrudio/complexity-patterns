import { ComponentFixture, TestBed } from '@angular/core/testing';
import { costFor } from '../../core/complexity';
import { PATTERNS } from '../../core/patterns.data';
import { toneVar } from '../../core/patterns.model';
import { GrowthChart } from './growth-chart';

describe('GrowthChart', () => {
  let fixture: ComponentFixture<GrowthChart>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GrowthChart] }).compileComponents();
    fixture = TestBed.createComponent(GrowthChart);
    el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  const slider = () => el.querySelector<HTMLInputElement>('input[type="range"]')!;
  const curves = () => Array.from(el.querySelectorAll<SVGPathElement>('path.curve'));
  const legendButtons = () => Array.from(el.querySelectorAll<HTMLButtonElement>('.legend button'));
  const tableRows = () => Array.from(el.querySelectorAll<HTMLTableRowElement>('tbody tr'));

  async function setN(n: number): Promise<void> {
    slider().value = String(n);
    slider().dispatchEvent(new Event('input'));
    await fixture.whenStable();
  }

  describe('R3 slider', () => {
    it('is a range input 2..32 with default 16 and label "n = 16"', () => {
      const s = slider();
      expect(s.min).toBe('2');
      expect(s.max).toBe('32');
      expect(s.value).toBe('16');
      expect(el.querySelector('.n-label')?.textContent?.trim()).toBe('n = 16');
    });

    it('recomputes curves, label and table when N changes', async () => {
      const before = curves()[2].getAttribute('d');
      await setN(4);
      expect(el.querySelector('.n-label')?.textContent?.trim()).toBe('n = 4');
      expect(curves()[2].getAttribute('d')).not.toBe(before);
      // constant command count (padded to MAX_N) so the CSS `d` transition can morph the curve
      expect((curves()[2].getAttribute('d')!.match(/[ML]/g) ?? []).length).toBe(32);
      expect(el.textContent).toContain('ops at n = 4');
    });
  });

  describe('R4 legend and highlight', () => {
    it('lists the 10 Big-O labels as buttons, plus a title', () => {
      const buttons = legendButtons();
      expect(buttons).toHaveLength(10);
      buttons.forEach((b, i) => {
        expect(b.type).toBe('button');
        expect(b.textContent).toContain(PATTERNS[i].bigO);
        expect(b.textContent).toContain(PATTERNS[i].title);
      });
      expect(el.querySelector('.legend-title')?.textContent).toBeTruthy();
    });

    it('hover/focus on a legend item highlights that curve and dims the others', async () => {
      legendButtons()[6].dispatchEvent(new Event('mouseenter'));
      await fixture.whenStable();
      const cs = curves();
      expect(cs[6].classList).toContain('is-active');
      expect(cs.filter((c) => c.classList.contains('is-dimmed'))).toHaveLength(9);
      expect(legendButtons()[6].getAttribute('aria-pressed')).toBe('true');

      legendButtons()[6].dispatchEvent(new Event('mouseleave'));
      await fixture.whenStable();
      expect(curves().some((c) => c.classList.contains('is-active') || c.classList.contains('is-dimmed'))).toBe(false);

      legendButtons()[1].dispatchEvent(new Event('focus'));
      await fixture.whenStable();
      expect(curves()[1].classList).toContain('is-active');
      legendButtons()[1].dispatchEvent(new Event('blur'));
      await fixture.whenStable();
      expect(curves()[1].classList).not.toContain('is-active');
    });

    it('hovering a curve highlights it too', async () => {
      curves()[3].dispatchEvent(new Event('mouseenter'));
      await fixture.whenStable();
      expect(curves()[3].classList).toContain('is-active');
      curves()[3].dispatchEvent(new Event('mouseleave'));
      await fixture.whenStable();
      expect(curves()[3].classList).not.toContain('is-active');
    });
  });

  describe('R5 table', () => {
    it('shows 10 rows sorted by ascending cost with formatted numbers', async () => {
      await setN(32);
      expect(el.textContent).toContain('ops at n = 32');
      const rows = tableRows();
      expect(rows).toHaveLength(10);
      expect(rows[0].textContent).toContain('O(1)');
      expect(rows[9].textContent).toContain('O(n!)');
      expect(rows[9].querySelector('.ops')?.textContent?.trim()).toBe('2.6e+35');
      const nested = rows.find((r) => r.textContent?.includes('Nested Loop'))!;
      expect(nested.querySelector('.ops')?.textContent?.trim()).toBe((1024).toLocaleString('en-US'));
      const branching = rows.find((r) => r.textContent?.includes('Branching Recursion'))!;
      expect(branching.querySelector('.ops')?.textContent?.trim()).toBe(
        costFor('branching-recursion', 32).toLocaleString('en-US'),
      );
    });
  });

  describe('R6 rendering', () => {
    it('renders a responsive SVG with one curve per pattern in its tone', () => {
      const svg = el.querySelector('svg')!;
      expect(svg.getAttribute('viewBox')).toMatch(/^0 0 \d+ \d+$/);
      expect(svg.hasAttribute('width')).toBe(false);
      const cs = curves();
      expect(cs).toHaveLength(10);
      cs.forEach((c, i) => expect(c.getAttribute('stroke')).toBe(toneVar(PATTERNS[i].tone)));
    });

    it('draws one horizontal grid line per decade with 10^k labels', () => {
      // N = 16 → max on-scale value is clipped (16! ≥ 1e12) → decades 0..12
      const lines = el.querySelectorAll('line.grid');
      expect(lines.length).toBe(13);
      const labels = Array.from(el.querySelectorAll('.y-label')).map((t) => t.textContent?.replace(/\s+/g, ''));
      expect(labels[0]).toBe('10^0');
      expect(labels[12]).toBe('10^12');
    });

    it('has the title and subtitle', () => {
      expect(el.querySelector('h2')?.textContent).toContain('How they grow');
      expect(el.textContent).toContain('operations vs. input size (log scale)');
    });
  });
});
