import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PATTERNS } from '../../../core/patterns.data';
import { PatternViz } from '../../../core/patterns.model';
import { emitOpsOnChange } from './emit-ops';
import { hashFrame } from './linear-frames';

const N = PATTERNS.find((p) => p.id === 'hash-lookup')!.vizN;

/** O(1): a key jumps straight to its bucket. */
@Component({
  selector: 'app-hash-lookup-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './linear-viz.scss',
  styles: `
    .key {
      padding: 0 5px;
      border-radius: 4px;
      border: 1px solid color-mix(in srgb, var(--c) 45%, transparent);
      background: color-mix(in srgb, var(--c) 12%, transparent);
      opacity: 0.55;
    }
    .key.jumped { opacity: 1; }
    .bucket { height: 26px; }
  `,
  template: `
    @let f = frame();
    <div class="viz" role="img" [attr.aria-label]="label()" [style.--c]="color()">
      <div class="lane">
        <span class="pointer key" [class.jumped]="f.jumped" [style.left.%]="keyLeft()">key ▾</span>
      </div>
      <div class="row">
        @for (b of indices; track b) {
          <div
            class="cell bucket"
            [class.on]="f.jumped && b === f.bucket"
            [class.cur]="f.jumped && b === f.bucket"
            [style.border-color]="f.jumped && b === f.bucket ? color() : 'var(--cell-border)'"
          ></div>
        }
      </div>
      <div class="row">
        @for (b of indices; track b) {
          <span class="lbl idx">{{ b }}</span>
        }
      </div>
    </div>
  `,
})
export class HashLookupViz implements PatternViz {
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();

  protected readonly indices = Array.from({ length: N }, (_, i) => i);
  protected readonly frame = computed(() => hashFrame(this.step(), N));
  protected readonly keyLeft = computed(() => {
    const f = this.frame();
    return f.jumped ? ((f.bucket + 0.5) / f.buckets) * 100 : 50;
  });
  protected readonly label = computed(() => {
    const f = this.frame();
    return f.jumped
      ? `Hash lookup: key found in bucket ${f.bucket} of ${f.buckets} with one jump`
      : `Hash lookup: key ready, ${f.buckets} buckets`;
  });

  constructor() {
    emitOpsOnChange(() => this.frame().ops, this.opsChange);
  }
}
