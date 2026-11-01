import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Board } from './features/board/board';
import { GrowthChart } from './features/growth-chart/growth-chart';

@Component({
  selector: 'app-root',
  imports: [Board, GrowthChart],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
