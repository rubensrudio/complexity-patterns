import {
  ComponentRef,
  Directive,
  InjectionToken,
  OnDestroy,
  OutputRefSubscription,
  Type,
  ViewContainerRef,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { PatternId, PatternViz } from '../../core/patterns.model';
import { VIZ_REGISTRY } from '../../core/viz-registry';

/** Registry the board reads visualizations from. Defaults to VIZ_REGISTRY (overridable in tests). */
export const BOARD_VIZ_REGISTRY = new InjectionToken<Readonly<Record<PatternId, Type<PatternViz>>>>(
  'BOARD_VIZ_REGISTRY',
  { providedIn: 'root', factory: () => VIZ_REGISTRY },
);

/**
 * Mounts a PatternViz component in place, keeps its `step`/`color` inputs in sync and
 * re-emits its `opsChange`. Subscriptions and the component are released on destroy.
 */
@Directive({ selector: '[appVizHost]' })
export class VizHost implements OnDestroy {
  readonly appVizHost = input.required<Type<PatternViz>>();
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();

  private readonly vcr = inject(ViewContainerRef);
  private ref: ComponentRef<PatternViz> | null = null;
  private sub: OutputRefSubscription | null = null;

  constructor() {
    effect(() => {
      const type = this.appVizHost();
      const step = this.step();
      const color = this.color();
      untracked(() => {
        if (this.ref?.componentType !== type) this.mount(type, step, color);
        this.ref!.setInput('step', step);
        this.ref!.setInput('color', color);
      });
    });
  }

  ngOnDestroy(): void {
    this.unmount();
  }

  private mount(type: Type<PatternViz>, step: number, color: string): void {
    this.unmount();
    const ref = this.vcr.createComponent(type);
    ref.setInput('step', step);
    ref.setInput('color', color);
    this.sub = ref.instance.opsChange.subscribe((ops) => this.opsChange.emit(ops));
    this.ref = ref;
  }

  private unmount(): void {
    this.sub?.unsubscribe();
    this.sub = null;
    this.ref?.destroy();
    this.ref = null;
  }
}
