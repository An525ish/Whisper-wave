import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';

const KLIPY_BASE = 'https://api.klipy.com/api/v1';

/** Docs: https://docs.klipy.com/getting-started */
export type KlipyKind = 'gif' | 'meme';

type KlipyFile = { url: string; width: number; height: number; size?: number };
type KlipyFormats = {
  gif?: KlipyFile;
  webp?: KlipyFile;
  jpg?: KlipyFile;
  png?: KlipyFile;
  mp4?: KlipyFile;
};
type KlipySizes = {
  hd?: KlipyFormats;
  md?: KlipyFormats;
  sm?: KlipyFormats;
  xs?: KlipyFormats;
};

type KlipyItem = {
  id: number | string;
  slug?: string;
  title: string;
  type?: string;
  file: KlipySizes;
};

type KlipyResponse = {
  result: boolean;
  data?: {
    data?: KlipyItem[];
    current_page?: number;
    per_page?: number;
    has_next?: boolean;
  };
};

const KIND_PATH: Record<KlipyKind, string> = {
  gif: 'gifs',
  meme: 'static-memes',
};

const parseKind = (raw: unknown): KlipyKind => {
  if (raw === 'meme' || raw === 'memes') return 'meme';
  return 'gif';
};

const pickFile = (
  formats?: KlipyFormats,
): { file: KlipyFile; mime: string } | null => {
  if (!formats) return null;
  if (formats.gif) return { file: formats.gif, mime: 'image/gif' };
  if (formats.png) return { file: formats.png, mime: 'image/png' };
  if (formats.webp) return { file: formats.webp, mime: 'image/webp' };
  if (formats.jpg) return { file: formats.jpg, mime: 'image/jpeg' };
  return null;
};

const normalise = (item: KlipyItem, kind: KlipyKind) => {
  const full =
    pickFile(item.file.hd) ?? pickFile(item.file.md) ?? pickFile(item.file.sm);
  const preview =
    pickFile(item.file.sm) ?? pickFile(item.file.md) ?? pickFile(item.file.hd);

  return {
    id: String(item.id),
    title: item.title || item.slug || kind.toUpperCase(),
    url: full?.file.url ?? '',
    previewUrl: preview?.file.url ?? full?.file.url ?? '',
    width: full?.file.width ?? 0,
    height: full?.file.height ?? 0,
    mimeType: full?.mime ?? (kind === 'meme' ? 'image/png' : 'image/gif'),
    kind,
  };
};

const klipyFetch = async (
  kind: KlipyKind,
  action: 'trending' | 'search',
  params: Record<string, string | number>,
): Promise<KlipyItem[]> => {
  const key = process.env.KLIPY_API_KEY?.trim();
  if (!key) {
    throw new AppError(503, 'KLIPY_API_KEY not configured');
  }

  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  const url = `${KLIPY_BASE}/${key}/${KIND_PATH[kind]}/${action}?${qs}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new AppError(502, 'Failed to reach Klipy');
  }

  if (!res.ok) {
    throw new AppError(502, `Klipy API error ${res.status}`);
  }

  const body = (await res.json()) as KlipyResponse;
  if (!body.result) {
    throw new AppError(502, 'Klipy returned an unsuccessful response');
  }

  return body.data?.data ?? [];
};

const clampPerPage = (raw: unknown, fallback = 24) => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), 8), 50);
};

export const searchMedia: RequestHandler = catchAsync(async (req, res) => {
  const kind = parseKind(req.query.kind);
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (!q) {
    throw new AppError(400, 'Search query is required');
  }

  const perPage = clampPerPage(req.query.limit ?? req.query.per_page);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const customerId =
    typeof req.query.customer_id === 'string'
      ? req.query.customer_id
      : req.userId;

  const items = await klipyFetch(kind, 'search', {
    q,
    page,
    per_page: perPage,
    content_filter: 'medium',
    locale: 'in',
    ...(customerId ? { customer_id: customerId } : {}),
    ...(kind === 'gif' ? { format_filter: 'gif,webp' } : {}),
  });

  res.status(200).json({
    success: true,
    data: items.map((item) => normalise(item, kind)),
  });
});

export const trendingMedia: RequestHandler = catchAsync(async (req, res) => {
  const kind = parseKind(req.query.kind);
  const perPage = clampPerPage(req.query.limit ?? req.query.per_page);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const customerId =
    typeof req.query.customer_id === 'string'
      ? req.query.customer_id
      : req.userId;

  const items = await klipyFetch(kind, 'trending', {
    page,
    per_page: perPage,
    content_filter: 'medium',
    locale: 'in',
    ...(customerId ? { customer_id: customerId } : {}),
    ...(kind === 'gif' ? { format_filter: 'gif,webp' } : {}),
  });

  res.status(200).json({
    success: true,
    data: items.map((item) => normalise(item, kind)),
  });
});

/** @deprecated aliases kept for older imports */
export const searchGifs = searchMedia;
export const trendingGifs = trendingMedia;
