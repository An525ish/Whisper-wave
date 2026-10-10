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

/** Feed selector — one pure scroll across every shelf, dark included. */
export type MemeCategory = 'programming' | 'misc' | 'pun' | 'dark' | 'mix';
