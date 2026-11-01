import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { PATTERNS } from '../../core/patterns.data';
import { PatternDef, PatternId, toneVar } from '../../core/patterns.model';
import {
  buildSeries,
  curvePath,
  decadeTicks,
  formatOps,
  rankAtN,
  topDecade,
  xScale,
  yScale,
} from './growth-chart.math';

export const MIN_N = 2;
export const MAX_N = 32;
export const DEFAULT_N = 16;

/** SVG viewBox geometry. */
const W = 640;
const H = 340;
const PLOT = { left: 52, right: W - 16, top: 14, bottom: H - 30 } as const;

const BY_ID = new Map<PatternId, PatternDef>(PATTERNS.map((p) => [p.id, p]));

interface Curve {
  readonly def: PatternDef;
  readonly color: string;
  readonly d: string;
}

@Component({
  selector: 'app-growth-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './growth-chart.scss',
  templateUrl: './growth-chart.html',
})
export class GrowthChart {
  protected readonly minN = MIN_N;
  protected readonly maxN = MAX_N;
  protected readonly plot = PLOT;
  protected readonly viewBox = `0 0 ${W} ${H}`;
  protected readonly patterns = PATTERNS;
  protected readonly toneVar = toneVar;

  protected readonly n = signal(DEFAULT_N);
  protected readonly highlighted = signal<PatternId | null>(null);

  private readonly series = computed(() => buildSeries(this.n()));

  private readonly decades = computed(() =>
    topDecade(Math.max(...this.series().flatMap((s) => s.points.map((p) => p.ops)))),
  );

  private readonly x = computed(() => xScale({ left: PLOT.left, right: PLOT.right, maxN: this.n() }));
  private readonly y = computed(() =>
    yScale({ top: PLOT.top, bottom: PLOT.bottom, decades: this.decades() }),
  );

  protected readonly curves = computed<Curve[]>(() => {
    const x = this.x();
    const y = this.y();
    return this.series().map((s) => {
      const def = BY_ID.get(s.id)!;
      const pts = s.points.map((p) => ({ x: x(p.n), y: y(p.ops).y }));
      return { def, color: toneVar(def.tone), d: curvePath(pts, MAX_N) };
    });
  });

  protected readonly yTicks = computed(() => {
    const y = this.y();
    return decadeTicks(this.decades()).map((t) => ({ k: t.k, y: y(t.value).y }));
  });

  protected readonly xTicks = computed(() => {
    const n = this.n();
    const x = this.x();
    const step = Math.ceil(n / 8);
    const values = new Set<number>([1]);
    for (let v = step; v < n; v += step) values.add(v);
    values.add(n);
    return [...values].map((v) => ({ n: v, x: x(v) }));
  });

  protected readonly rows = computed(() =>
    rankAtN(this.n()).map((r) => {
      const def = BY_ID.get(r.id)!;
      return { def, color: toneVar(def.tone), ops: formatOps(r.ops) };
    }),
  );

  protected onInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (Number.isInteger(value) && value >= MIN_N && value <= MAX_N) this.n.set(value);
  }

  protected highlight(id: PatternId): void {
    this.highlighted.set(id);
  }

  protected clear(id: PatternId): void {
    if (this.highlighted() === id) this.highlighted.set(null);
  }
}
