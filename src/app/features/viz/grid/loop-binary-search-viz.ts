import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PatternViz } from '../../../core/patterns.model';

/** STUB — to be implemented by the viz-grid agent. */
@Component({
  selector: 'app-loop-binary-search-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="viz-stub">LoopBinarySearchViz · step {{ step() }}</span>`,
})
export class LoopBinarySearchViz implements PatternViz {
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();
}
