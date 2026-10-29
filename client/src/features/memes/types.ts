/** One joke card, as served by `GET /api/memes`. */
export type MemeItem = {
  id: number;
  category: string;
  setup: string;
  delivery?: string;
  imageUrl: string;
};

export type MemeFeedData = {
  items: MemeItem[];
  page: number;
  stale?: boolean;
};

export type MemeFeedResponse = {
  success: boolean;
  data: MemeFeedData;
};

/** The shelves the server serves. `dark` is members-with-unfiltered only. */
export type MemeCategory = 'programming' | 'misc' | 'pun' | 'dark' | 'mix';

/** Why a joke is being reported — mirrors the server's `memeReportSchema`. */
export type MemeReportReason = 'offensive' | 'sexual' | 'hateful' | 'broken' | 'other';

export type MemeReportResult = {
  counted: boolean;
  blocked: boolean;
};

export type MemeReportResponse = {
  success: boolean;
  data: MemeReportResult;
};

/** One row of the virtualized feed: a joke, or the "find someone" interstitial. */
export type MemeFeedRow =
  | { kind: 'meme'; key: string; item: MemeItem; index: number }
  | { kind: 'cta'; key: string };

/** A decorative rising emoji behind the feed viewport. */
export type MemeFloater = {
  glyph: string;
  left: string;
  size: string;
  duration: string;
  delay: string;
};

export type MemeCategoryChip = {
  id: MemeCategory;
  label: string;
};
