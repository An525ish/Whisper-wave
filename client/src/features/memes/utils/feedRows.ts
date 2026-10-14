import { MEME_CTA_EVERY } from '../constants';
import type { MemeFeedRow, MemeItem } from '../types';

/**
 * Drops hidden and repeated jokes, then weaves the "find someone" card in
 * after every `MEME_CTA_EVERY`th joke. Pure — the virtualizer indexes the result.
 */
export const buildFeedRows = (items: MemeItem[], hidden: ReadonlySet<number>): MemeFeedRow[] => {
  const seen = new Set<number>();
  const rows: MemeFeedRow[] = [];
  for (const item of items) {
    if (hidden.has(item.id) || seen.has(item.id)) continue;
    seen.add(item.id);
    const index = seen.size - 1;
    rows.push({ kind: 'meme', key: `m-${item.id}`, item, index });
    if (seen.size % MEME_CTA_EVERY === 0) rows.push({ kind: 'cta', key: `cta-${seen.size}` });
  }
  return rows;
};
