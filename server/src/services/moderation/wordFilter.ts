import { WordFilter } from '../../models/wordFilter.js';
import { logger } from '../../utils/logger.js';
import {
  cleanTerm,
  DEFAULT_CATEGORIES,
  defaultWordFilter,
  getWordFilter,
  setWordFilter,
  type WordFilterConfig,
} from '../match/moderation.js';

/** Terms are short phrases; the caps keep one save from becoming a giant regex. */
export const WORD_MAX_LENGTH = 60;
export const WORDS_PER_CATEGORY_MAX = 500;

/** Fill in anything the stored document does not mention with the built-in defaults. */
const merge = (stored: { enabled: boolean; categories: Array<{ id: string; enabled: boolean; terms: string[] }> } | null): WordFilterConfig => {
  const config = defaultWordFilter();
  if (!stored) return config;
  config.enabled = stored.enabled;
  for (const c of stored.categories) {
    if (c.id in config.categories) config.categories[c.id] = { enabled: c.enabled, terms: c.terms };
  }
  return config;
};

/** Boot: read the saved settings into the live filter. A failure keeps the safe default (filter on). */
export const loadWordFilter = async (): Promise<void> => {
  try {
    setWordFilter(merge(await WordFilter.findOne({ key: 'main' }).lean()));
  } catch (err) {
    logger.error({ err }, 'Could not load word filter settings; using built-in defaults');
  }
};

/** What the admin panel shows: live settings plus each category's meta and built-in terms. */
export const readWordFilter = () => {
  const config = getWordFilter();
  return {
    enabled: config.enabled,
    categories: DEFAULT_CATEGORIES.map((c) => ({
      id: c.id,
      label: c.label,
      severe: c.severe,
      enabled: config.categories[c.id]?.enabled ?? true,
      terms: config.categories[c.id]?.terms ?? [],
      defaultTerms: [...c.terms],
    })),
  };
};

export const saveWordFilter = async (input: WordFilterConfig) => {
  // Clean and de-duplicate here so the stored list is what the filter really matches.
  const categories = DEFAULT_CATEGORIES.map((c) => {
    const given = input.categories[c.id];
    return {
      id: c.id,
      enabled: given?.enabled ?? true,
      terms: [...new Set((given?.terms ?? []).map(cleanTerm).filter(Boolean))],
    };
  });
  await WordFilter.updateOne({ key: 'main' }, { $set: { enabled: input.enabled, categories } }, { upsert: true });
  setWordFilter(merge({ enabled: input.enabled, categories }));
  return readWordFilter();
};
