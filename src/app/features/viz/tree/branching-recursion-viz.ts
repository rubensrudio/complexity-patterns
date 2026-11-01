import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { costFor } from '../../../core/complexity';
import { PATTERNS } from '../../../core/patterns.data';
import { PatternViz } from '../../../core/patterns.model';

const DEF = PATTERNS.find((p) => p.id === 'branching-recursion')!;
/** Tree depth (number of levels). */
const DEPTH = DEF.vizN;
/** Total calls of a full binary recursion tree of depth n. */
const TOTAL = costFor(DEF.id, DEPTH);
/** Frames shown with the finished tree before looping. */
const HOLD = 4;

/** Frame 0 = empty tree, frames 1..TOTAL = one call each, then HOLD frames of the full tree. */
export const BRANCHING_CYCLE_LENGTH = 1 + TOTAL + HOLD;

const VB_W = 340;
const VB_H = 96;
const TREE_X0 = 30;
const TREE_X1 = 336;
const PAD_Y = 12;

interface TreeNode {
  readonly key: string;
  readonly depth: number;
  readonly x: number;
  readonly y: number;
  readonly r: number;
  /** Position in the depth-first pre-order walk (0-based). */
  readonly order: number;
}

interface TreeEdge {
  readonly key: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  /** Order of the child call; the edge lights with it. */
  readonly order: number;
}

function levelY(d: number): number {
  return DEPTH <= 1 ? VB_H / 2 : PAD_Y + (d * (VB_H - 2 * PAD_Y)) / (DEPTH - 1);
}

function buildTree(): { nodes: TreeNode[]; edges: TreeEdge[] } {
  const nodes: TreeNode[] = [];
  const edges: TreeEdge[] = [];
  const width = TREE_X1 - TREE_X0;
  const leafSpacing = width / 2 ** (DEPTH - 1);
  const r = Math.max(3, Math.min(7, leafSpacing * 0.2));
  const visit = (d: number, i: number, parent: TreeNode | null): void => {
    const node: TreeNode = {
      key: `${d}-${i}`,
      depth: d,
      x: TREE_X0 + ((i + 0.5) * width) / 2 ** d,
      y: levelY(d),
      r,
      order: nodes.length,
    };
    nodes.push(node);
    if (parent) {
      edges.push({ key: `${parent.key}>${node.key}`, x1: parent.x, y1: parent.y, x2: node.x, y2: node.y, order: node.order });
    }
    if (d < DEPTH - 1) {
      visit(d + 1, 2 * i, node);
      visit(d + 1, 2 * i + 1, node);
    }
  };
  visit(0, 0, null);
  return { nodes, edges };
}

const TREE = buildTree();
const LEVELS = Array.from({ length: DEPTH }, (_, d) => ({ count: 2 ** d, y: levelY(d) }));

/** O(2ⁿ): a full binary recursion tree lit in depth-first (pre-order) call order. */
@Component({
  selector: 'app-branching-recursion-viz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './tree-viz.scss',
  host: {
    role: 'img',
    '[attr.aria-label]': 'label()',
  },
  template: `
    <svg [attr.viewBox]="viewBox" preserveAspectRatio="xMidYMid meet" aria-hidden="true" [attr.color]="color()">
      @for (lvl of levels; track lvl.count) {
        <text class="lbl" data-level-count x="12" [attr.y]="lvl.y + 3" text-anchor="middle">{{ lvl.count }}</text>
      }
      @for (e of edges; track e.key) {
        <line
          class="edge"
          data-edge
          [class.on]="e.order < lit()"
          [attr.x1]="e.x1" [attr.y1]="e.y1" [attr.x2]="e.x2" [attr.y2]="e.y2"
          [attr.stroke]="e.order < lit() ? color() : 'var(--cell-border)'"
        />
      }
      @for (n of nodes; track n.key) {
        <circle
          class="node"
          [attr.data-node]="n.key"
          [class.on]="n.order < lit()"
          [class.active]="n.order === activeOrder()"
          [attr.cx]="n.x" [attr.cy]="n.y" [attr.r]="n.r"
          [attr.fill]="n.order < lit() ? color() : 'var(--cell)'"
          [attr.fill-opacity]="n.order === activeOrder() ? 0.9 : n.order < lit() ? 0.3 : 1"
          [attr.stroke]="n.order < lit() ? color() : 'var(--cell-border)'"
        />
      }
    </svg>
  `,
})
export class BranchingRecursionViz implements PatternViz {
  readonly step = input.required<number>();
  readonly color = input.required<string>();
  readonly opsChange = output<number>();

  protected readonly viewBox = `0 0 ${VB_W} ${VB_H}`;
  protected readonly nodes = TREE.nodes;
  protected readonly edges = TREE.edges;
  protected readonly levels = LEVELS;

  private readonly frame = computed(() => {
    const s = Math.floor(this.step());
    return ((s % BRANCHING_CYCLE_LENGTH) + BRANCHING_CYCLE_LENGTH) % BRANCHING_CYCLE_LENGTH;
  });
  /** Calls made so far in this cycle. */
  protected readonly lit = computed(() => Math.min(this.frame(), TOTAL));
  /** Pre-order index of the call running now, or -1 (before start / during hold). */
  protected readonly activeOrder = computed(() => (this.frame() >= 1 && this.frame() <= TOTAL ? this.frame() - 1 : -1));

  protected readonly label = computed(() => {
    const lit = this.lit();
    const active = this.activeOrder();
    if (lit === 0) return `Branching recursion: 0 of ${TOTAL} calls, starting`;
    if (active < 0) {
      return `Branching recursion: all ${TOTAL} calls done, ${LEVELS.map((l) => l.count).join(' ')} calls per level`;
    }
    return `Branching recursion: call ${lit} of ${TOTAL}, at depth ${this.nodes[active].depth}`;
  });

  private lastOps: number | null = null;

  constructor() {
    effect(() => {
      const ops = this.lit();
      if (ops !== this.lastOps) {
        this.lastOps = ops;
        this.opsChange.emit(ops);
      }
    });
  }
}
