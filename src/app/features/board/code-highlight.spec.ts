import { highlight } from './code-highlight';
import { PATTERNS } from '../../core/patterns.data';

describe('highlight', () => {
  it('marks keywords, numbers and function calls', () => {
    expect(highlight('for (i = 0; i < n; i++)')).toEqual([
      { text: 'for', kind: 'keyword' },
      { text: ' (i = ', kind: 'plain' },
      { text: '0', kind: 'number' },
      { text: '; i < n; i++)', kind: 'plain' },
    ]);
    expect(highlight('    binarySearch(a, x)')).toEqual([
      { text: '    ', kind: 'plain' },
      { text: 'binarySearch', kind: 'fn' },
      { text: '(a, x)', kind: 'plain' },
    ]);
  });

  it('recognizes while, in and dotted calls', () => {
    const kinds = (l: string) => highlight(l).filter((t) => t.kind !== 'plain');
    expect(kinds('while (n > 1)')).toEqual([
      { text: 'while', kind: 'keyword' },
      { text: '1', kind: 'number' },
    ]);
    expect(kinds('value = map.get(key)')).toEqual([{ text: 'get', kind: 'fn' }]);
    expect(kinds('    for x in rest: permute(prefix + x, rest - x)')).toEqual([
      { text: 'for', kind: 'keyword' },
      { text: 'in', kind: 'keyword' },
      { text: 'permute', kind: 'fn' },
    ]);
  });

  it('does not split identifiers containing keywords or digits', () => {
    expect(highlight('index2 = info')).toEqual([{ text: 'index2 = info', kind: 'plain' }]);
  });

  it('preserves the original text of every pattern line', () => {
    for (const p of PATTERNS) {
      for (const line of p.code) {
        expect(highlight(line).map((t) => t.text).join('')).toBe(line);
      }
    }
    expect(highlight('')).toEqual([]);
  });
});
