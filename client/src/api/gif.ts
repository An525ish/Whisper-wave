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

export type GifListResponse = {
  success: boolean;
  data: GifItem[];
  page: number;
  hasNext: boolean;
};

export const searchMedia = (
  q: string,
  kind: KlipyKind = 'gif',
  page = 1,
  limit = 24,
) => api.get<GifListResponse>('/gif/search', { q, kind, page, limit });

export const trendingMedia = (
  kind: KlipyKind = 'gif',
  page = 1,
  limit = 24,
) => api.get<GifListResponse>('/gif/trending', { kind, page, limit });
