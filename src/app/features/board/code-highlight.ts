export type TokenKind = 'keyword' | 'number' | 'fn' | 'plain';

export interface CodeToken {
  readonly text: string;
  readonly kind: TokenKind;
}

const KEYWORDS: ReadonlySet<string> = new Set(['for', 'while', 'in']);
/** Identifiers or standalone numbers; everything else is plain text. */
const WORD = /[A-Za-z_$][\w$]*|\d+(?:\.\d+)?/g;

/**
 * Splits a code line into highlight tokens. Pure: concatenating the token texts
 * gives back the original line (indentation included). Adjacent plain text is merged.
 */
export function highlight(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  const push = (text: string, kind: TokenKind): void => {
    if (!text) return;
    const last = tokens[tokens.length - 1];
    if (kind === 'plain' && last?.kind === 'plain') {
      tokens[tokens.length - 1] = { text: last.text + text, kind };
    } else {
      tokens.push({ text, kind });
    }
  };

  let cursor = 0;
  for (const match of line.matchAll(WORD)) {
    const word = match[0];
    const start = match.index;
    push(line.slice(cursor, start), 'plain');
    cursor = start + word.length;
    push(word, classify(word, line[cursor]));
  }
  push(line.slice(cursor), 'plain');
  return tokens;
}

function classify(word: string, next: string | undefined): TokenKind {
  if (/^\d/.test(word)) return 'number';
  if (KEYWORDS.has(word)) return 'keyword';
  if (next === '(') return 'fn';
  return 'plain';
}
