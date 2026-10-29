import type { MemeItem } from '../types';

/** The joke as plain text: setup, then the punchline on its own line. */
export const memeText = (item: Pick<MemeItem, 'setup' | 'delivery'>): string =>
  item.delivery ? `${item.setup}\n${item.delivery}` : item.setup;
