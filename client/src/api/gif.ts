import { api } from '@/api/client';

export type KlipyKind = 'gif' | 'meme';

export type GifItem = {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  mimeType: string;
  kind: KlipyKind;
};

type GifListResponse = { success: boolean; data: GifItem[] };

export const searchMedia = (q: string, kind: KlipyKind = 'gif', limit = 24) =>
  api.get<GifListResponse>('/gif/search', { q, kind, limit });

export const trendingMedia = (kind: KlipyKind = 'gif', limit = 24) =>
  api.get<GifListResponse>('/gif/trending', { kind, limit });

/** @deprecated aliases */
export const searchGifs = (q: string, limit = 24) => searchMedia(q, 'gif', limit);
export const trendingGifs = (limit = 24) => trendingMedia('gif', limit);
