import { describe, expect, it } from 'vitest';
import { MEME_CTA_EVERY } from '../../constants';
import { buildFeedRows } from '../feedRows';
import type { MemeItem } from '../../types';

const joke = (id: number): MemeItem => ({ id, category: 'Misc', setup: `s${id}`, imageUrl: '' });

describe('buildFeedRows', () => {
  it('skips hidden and duplicate jokes', () => {
    const rows = buildFeedRows([joke(1), joke(2), joke(2), joke(3)], new Set([1]));
    expect(rows.map((r) => r.key)).toEqual(['m-2', 'm-3']);
  });

  it('adds a CTA after every Nth visible joke', () => {
    const items = Array.from({ length: MEME_CTA_EVERY + 1 }, (_, i) => joke(i));
    const rows = buildFeedRows(items, new Set());
    expect(rows[MEME_CTA_EVERY].kind).toBe('cta');
    expect(rows).toHaveLength(MEME_CTA_EVERY + 2);
  });
});
