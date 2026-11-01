import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { costFor, factorial } from '../../../core/complexity';
import { PATTERNS } from '../../../core/patterns.data';
import { PatternViz } from '../../../core/patterns.model';

const DEF = PATTERNS.find((p) => p.id === 'permutations')!;
const N = DEF.vizN;
/** Leaves of the permutation tree = permutations generated. */
const TOTAL = costFor(DEF.id, N);
/** Frames shown with every permutation generated before looping. */
const HOLD = 4;

/** Frame 0 = nothing generated, frames 1..TOTAL = one leaf each, then HOLD frames. */
export const PERMUTATIONS_CYCLE_LENGTH = 1 + TOTAL + HOLD;

const SYMBOLS = Array.from({ length: N }, (_, i) => String.fromCharCode(65 + i));
/** Tree levels drawn: root (empty prefix) down to prefixes of length n-1 (the last choice is forced). */
const LEVEL_COUNT = Math.max(1, N);

const VB_W = 340;
const VB_H = 96;
const TREE_X0 = 76;
const TREE_X1 = 336;
const PAD_TOP = 10;
const PAD_BOTTOM = 10;

/** Number of leaves below a node at depth d. */
function leavesBelow(d: number): number {
  return factorial(N - d);
}

/** k-th permutation (0-based) in lexicographic order. */
export function permutationAt(k: number, symbols: readonly string[] = SYMBOLS): string[] {
  const rest = [...symbols];
  const out: string[] = [];
  let idx = k;
  for (let i = rest.length - 1; i >= 0; i--) {
    const f = factorial(i);
    out.push(rest.splice(Math.floor(idx / f), 1)[0]);
    idx %= f;
  }
  return out;
}

interface PermNode {
  readonly key: string;
  readonly depth: number;
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly leaf: boolean;
  /** Letter chosen at this node (shown on the first level only). */
  readonly text: string | null;
}

interface PermEdge {
  readonly key: string;
  readonly depth: number;
  readonly index: number;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

function levelY(d: number): number {
  return LEVEL_COUNT <= 1 ? VB_H / 2 : PAD_TOP + (d * (VB_H - PAD_TOP - PAD_BOTTOM)) / (LEVEL_COUNT - 1);
}

function buildTree(): { nodes: PermNode[]; edges: PermEdge[] } {
  const nodes: PermNode[] = [];
  const edges: PermEdge[] = [];
  const width = TREE_X1 - TREE_X0;
  const levels: PermNode[][] = [];
  for (let d = 0; d < LEVEL_COUNT; d++) {
    const count = TOTAL / leavesBelow(d);
    const spacing = width / count;
    const leaf = d === LEVEL_COUNT - 1;
    const r = d === 0 ? 5 : Math.max(2.5, Math.min(7, spacing * 0.25));
    const level: PermNode[] = [];
    for (let j = 0; j < count; j++) {
      const node: PermNode = {
        key: `${d}-${j}`,
        depth: d,
        index: j,
        x: TREE_X0 + (j + 0.5) * spacing,
        y: levelY(d),
        r,
        leaf,
        text: d === 1 && !leaf ? permutationAt(j * leavesBelow(1))[0] : null,
      };
      level.push(node);
      nodes.push(node);
      if (d > 0) {
        const parent = levels[d - 1][Math.floor(j / (N - d + 1))];
        edges.push({ key: `${parent.key}>${node.key}`, depth: d, index: j, x1: parent.x, y1: parent.y, x2: node.x, y2: node.y });
      }
    }
    levels.push(level);
  }
  return { nodes, edges };
}

const TREE = buildTree();

/** O(n!): depth-first walk of the permutation tree; every leaf is one generated permutation. */
@Component({
  selector: 'app-permutations-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './tree-viz.scss',
  host: {
    role: 'img',
    '[attr.aria-label]': 'label()',
  },
  template: `
    <svg [attr.viewBox]="viewBox" preserveAspectRatio="xMidYMid meet" aria-hidden="true" [attr.color]="color()">
      <text class="current" data-current x="6" y="46" [class.idle]="done() === 0">{{ currentText() }}</text>
      <text class="lbl" x="6" y="60">{{ done() }}/{{ total }}</text>
      @for (e of edges; track e.key) {
        <line
          class="edge"
          [class.on]="visited(e.depth, e.index)"
          [attr.x1]="e.x1" [attr.y1]="e.y1" [attr.x2]="e.x2" [attr.y2]="e.y2"
          [attr.stroke]="visited(e.depth, e.index) ? color() : 'var(--cell-border)'"
        />
      }
      @for (n of nodes; track n.key) {
        <circle
          class="node"
          [class.leaf]="n.leaf"
          [attr.data-node]="n.key"
          [attr.data-level]="n.depth"
          [class.on]="visited(n.depth, n.index)"
          [class.active]="isActive(n.depth, n.index)"
          [attr.cx]="n.x" [attr.cy]="n.y" [attr.r]="n.r"
          [attr.fill]="visited(n.depth, n.index) ? color() : 'var(--cell)'"
          [attr.fill-opacity]="isActive(n.depth, n.index) ? 0.9 : visited(n.depth, n.index) ? (n.leaf ? 0.6 : 0.25) : 1"
          [attr.stroke]="visited(n.depth, n.index) ? color() : 'var(--cell-border)'"
        />
        @if (n.text) {
          <text class="node-lbl" [class.on]="isActive(n.depth, n.index)" [attr.x]="n.x" [attr.y]="n.y + 2.5" text-anchor="middle">{{ n.text }}</text>
        }
      }
    </svg>
  `,
})
export class PermutationsViz implements PatternViz {
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();

  protected readonly viewBox = `0 0 ${VB_W} ${VB_H}`;
  protected readonly nodes = TREE.nodes;
  protected readonly edges = TREE.edges;
  protected readonly total = TOTAL;

  private readonly frame = computed(() => {
    const s = Math.floor(this.step());
    return ((s % PERMUTATIONS_CYCLE_LENGTH) + PERMUTATIONS_CYCLE_LENGTH) % PERMUTATIONS_CYCLE_LENGTH;
  });
  /** Permutations generated so far in this cycle. */
  protected readonly done = computed(() => Math.min(this.frame(), TOTAL));
  private readonly running = computed(() => this.frame() >= 1 && this.frame() <= TOTAL);
  /** Last generated permutation (leaf index done-1), or null before the first. */
  private readonly current = computed(() => (this.done() > 0 ? permutationAt(this.done() - 1) : null));

  protected readonly currentText = computed(() => (this.current() ?? SYMBOLS.map(() => '·')).join(' '));

  protected readonly label = computed(() => {
    const done = this.done();
    if (done === 0) return `Permutations: 0 of ${TOTAL} generated, starting`;
    if (!this.running()) return `Permutations: all ${TOTAL} permutations generated`;
    return `Permutations: generated ${done} of ${TOTAL}, current ${this.currentText()}`;
  });

  private lastOps: number | null = null;

  constructor() {
    effect(() => {
      const ops = this.done();
      if (ops !== this.lastOps) {
        this.lastOps = ops;
        this.opsChange.emit(ops);
      }
    });
  }

  /** A node is visited once the walk has reached any leaf below it. */
  protected visited(depth: number, index: number): boolean {
    const done = this.done();
    return done > 0 && index <= Math.floor((done - 1) / leavesBelow(depth));
  }

  /** A node is active when it lies on the path to the permutation just generated. */
  protected isActive(depth: number, index: number): boolean {
    return this.running() && index === Math.floor((this.done() - 1) / leavesBelow(depth));
  }
}
