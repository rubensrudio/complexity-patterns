import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PatternViz } from '../../../core/patterns.model';

/** STUB — to be implemented by the viz-linear agent. */
@Component({
  selector: 'app-sequential-loops-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="viz-stub">SequentialLoopsViz · step {{ step() }}</span>`,
})
export class SequentialLoopsViz implements PatternViz {
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();
}
