import { Type } from '@angular/core';
import { PatternId, PatternViz } from './patterns.model';
import { HashLookupViz } from '../features/viz/linear/hash-lookup-viz';
import { HalvingLoopViz } from '../features/viz/linear/halving-loop-viz';
import { SingleLoopViz } from '../features/viz/linear/single-loop-viz';
import { SequentialLoopsViz } from '../features/viz/linear/sequential-loops-viz';
import { LoopBinarySearchViz } from '../features/viz/grid/loop-binary-search-viz';
import { DivideConquerViz } from '../features/viz/grid/divide-conquer-viz';
import { NestedLoopViz } from '../features/viz/grid/nested-loop-viz';
import { TriangularLoopViz } from '../features/viz/grid/triangular-loop-viz';
import { BranchingRecursionViz } from '../features/viz/tree/branching-recursion-viz';
import { PermutationsViz } from '../features/viz/tree/permutations-viz';

/** Visualization component of each pattern. Render with NgComponentOutlet (inputs: step, color). */
export const VIZ_REGISTRY: Readonly<Record<PatternId, Type<PatternViz>>> = {
  'hash-lookup': HashLookupViz,
  'halving-loop': HalvingLoopViz,
  'single-loop': SingleLoopViz,
  'sequential-loops': SequentialLoopsViz,
  'loop-binary-search': LoopBinarySearchViz,
  'divide-conquer': DivideConquerViz,
  'nested-loop': NestedLoopViz,
  'triangular-loop': TriangularLoopViz,
  'branching-recursion': BranchingRecursionViz,
  'permutations': PermutationsViz,
};
