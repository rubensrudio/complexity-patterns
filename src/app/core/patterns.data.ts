import { PatternDef } from './patterns.model';

export const PATTERNS: readonly PatternDef[] = [
  {
    id: 'hash-lookup', index: 1, title: 'Hash Lookup',
    code: ['value = map.get(key)'],
    bigO: 'O(1)', caption: 'one jump, any n', vizLabel: 'key', tone: 'green', vizN: 8,
  },
  {
    id: 'halving-loop', index: 2, title: 'Halving Loop',
    code: ['while (n > 1)', '    n = n / 2'],
    bigO: 'O(log n)', caption: 'halves every step', vizLabel: 'steps', tone: 'violet', vizN: 64,
  },
  {
    id: 'single-loop', index: 3, title: 'Single Loop',
    code: ['for (i = 0; i < n; i++)', '    sum += a[i]'],
    bigO: 'O(n)', caption: 'touch each once', vizLabel: 'i', tone: 'cyan', vizN: 12,
  },
  {
    id: 'sequential-loops', index: 4, title: 'Sequential Loops',
    code: ['for (i = 0; i < n; i++) { }', 'for (j = 0; j < m; j++) { }'],
    bigO: 'O(n + m)', caption: 'one pass over each', vizLabel: 'n, m', tone: 'indigo', vizN: 12,
  },
  {
    id: 'loop-binary-search', index: 5, title: 'Loop + Binary Search',
    code: ['for (i = 0; i < n; i++)', '    binarySearch(a, x)'],
    bigO: 'O(n log n)', caption: 'n × log n work', vizLabel: 'log n search per element', tone: 'teal', vizN: 10,
  },
  {
    id: 'divide-conquer', index: 6, title: 'Divide & Conquer',
    code: ['T(n) = 2T(n/2) + n'],
    bigO: 'O(n log n)', caption: 'log n levels × n', vizLabel: 'each level = n work', tone: 'teal', vizN: 8,
  },
  {
    id: 'nested-loop', index: 7, title: 'Nested Loop',
    code: ['for (i = 0; i < n; i++)', '    for (j = 0; j < n; j++)'],
    bigO: 'O(n²)', caption: 'all n × n pairs', vizLabel: 'n rows × n cols', tone: 'pink', vizN: 6,
  },
  {
    id: 'triangular-loop', index: 8, title: 'Triangular Loop',
    code: ['for (i = 0; i < n; i++)', '    for (j = 0; j < i; j++)'],
    bigO: 'O(n²)', caption: 'n(n-1)/2 pairs', vizLabel: 'half the grid', tone: 'pink', vizN: 6,
  },
  {
    id: 'branching-recursion', index: 9, title: 'Branching Recursion',
    code: ['T(n) = T(n-1) + T(n-2)'],
    bigO: 'O(2ⁿ)', caption: 'doubles per level', vizLabel: 'calls per level', tone: 'amber', vizN: 4,
  },
  {
    id: 'permutations', index: 10, title: 'Permutations',
    code: ['permute(prefix, rest)', '    for x in rest: permute(prefix + x, rest - x)'],
    bigO: 'O(n!)', caption: 'n × (n-1) × … × 1', vizLabel: 'branches shrink by one', tone: 'red', vizN: 4,
  },
];
