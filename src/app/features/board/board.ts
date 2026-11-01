import { ChangeDetectionStrategy, Component } from '@angular/core';

/** STUB — to be implemented by the board agent. */
@Component({
  selector: 'app-board',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>board</p>`,
})
export class Board {}
