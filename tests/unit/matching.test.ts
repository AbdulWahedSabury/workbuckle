import { describe, expect, it } from 'vitest';
import {
  EMBEDDING_DIMENSIONS,
  chunkWords,
  cvPreview,
  htmlToText,
  matchPercent,
  meanNormalized,
  toVectorLiteral,
} from '@/lib/matching/vector';

describe('chunkWords', () => {
  it('splits on whitespace into fixed-size word chunks', () => {
    expect(chunkWords('a b c d e', 2)).toEqual(['a b', 'c d', 'e']);
  });

  it('caps the number of chunks and ignores blank text', () => {
    expect(chunkWords('a b c d e f', 2, 2)).toEqual(['a b', 'c d']);
    expect(chunkWords('   \n ')).toEqual([]);
  });
});

describe('meanNormalized', () => {
  it('averages and rescales to unit length', () => {
    const [x, y] = meanNormalized([
      [1, 0],
      [0, 1],
    ]);
    expect(x).toBeCloseTo(Math.SQRT1_2);
    expect(y).toBeCloseTo(Math.SQRT1_2);
  });

  it('keeps a single unit vector as is', () => {
    expect(meanNormalized([[0, 1]])).toEqual([0, 1]);
  });

  it('refuses an empty list', () => {
    expect(() => meanNormalized([])).toThrow();
  });
});

describe('toVectorLiteral', () => {
  it('formats a 384-number vector for pgvector', () => {
    const literal = toVectorLiteral(new Array(EMBEDDING_DIMENSIONS).fill(0.5));
    expect(literal.startsWith('[0.5,0.5')).toBe(true);
    expect(literal.split(',')).toHaveLength(EMBEDDING_DIMENSIONS);
  });

  it('rejects the wrong size or non-finite values', () => {
    expect(() => toVectorLiteral([1, 2, 3])).toThrow();
    expect(() => toVectorLiteral(new Array(EMBEDDING_DIMENSIONS).fill(Number.NaN))).toThrow();
  });
});

describe('matchPercent', () => {
  it.each([
    [0.873, 87],
    [0.5, 50],
    [-0.2, 0],
    [1.0000001, 100],
  ])('%s → %s%%', (similarity, percent) => {
    expect(matchPercent(similarity)).toBe(percent);
  });
});

describe('htmlToText', () => {
  it('strips tags and decodes common entities', () => {
    expect(htmlToText('<p>Cook &amp; serve</p><ul><li>Grill</li><li>Pastry&nbsp;work</li></ul>')).toBe(
      'Cook & serve Grill Pastry work'
    );
  });
});

describe('cvPreview', () => {
  it('starts at the skills section when there is one', () => {
    expect(cvPreview('Maria Ng, Larnaca. Profile text. Skills: grill, pastry, HACCP')).toBe('Skills: grill, pastry, HACCP');
  });

  it('falls back to the start and cuts long text at a word', () => {
    const preview = cvPreview(`Experienced chef ${'with many years of work '.repeat(20)}`, 40);
    expect(preview.endsWith('…')).toBe(true);
    expect(preview.length).toBeLessThanOrEqual(41);
    expect(preview.startsWith('Experienced chef')).toBe(true);
  });
});
