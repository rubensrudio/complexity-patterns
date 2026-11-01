import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PatternViz } from '../../../core/patterns.model';

/** STUB — to be implemented by the viz-linear agent. */
@Component({
  selector: 'app-single-loop-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="viz-stub">SingleLoopViz · step {{ step() }}</span>`,
})
export class SingleLoopViz implements PatternViz {
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();
}
