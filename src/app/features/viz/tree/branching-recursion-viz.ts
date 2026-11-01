import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PatternViz } from '../../../core/patterns.model';

/** STUB — to be implemented by the viz-tree agent. */
@Component({
  selector: 'app-branching-recursion-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="viz-stub">BranchingRecursionViz · step {{ step() }}</span>`,
})
export class BranchingRecursionViz implements PatternViz {
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();
}
