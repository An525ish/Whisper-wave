import type { LinkPreviewData } from '../../types/linkPreview.js';
import { AppError } from '../../utils/AppError.js';

const MAX_BYTES = 200_000;
const TIMEOUT_MS = 6_000;

const PRIVATE_HOST =
  /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1)/;

const pick = (html: string, patterns: RegExp[]): string | null => {
  for (const re of patterns) {
    const m = re.exec(html);
    if (m?.[1]?.trim()) return m[1].trim();
  }
  return null;
};

const resolveUrl = (base: string, src: string | null): string | null => {
  if (!src) return null;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
};

const faviconForHost = (hostname: string) =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;

const stripWww = (hostname: string) => hostname.replace(/^www\./, '');

const assertPublicUrl = (rawUrl: string): URL => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new AppError(400, 'Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new AppError(400, 'Only http/https URLs are allowed');
  }

  if (PRIVATE_HOST.test(parsed.hostname)) {
    throw new AppError(400, 'Private URLs are not allowed');
  }

  return parsed;
};

const readLimitedHtml = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<string> => {
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    total += value.byteLength;
    if (total >= MAX_BYTES) {
      await reader.cancel();
      break;
    }
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(merged);
};

const minimalPreview = (rawUrl: string, parsed: URL): LinkPreviewData => ({
  url: rawUrl,
  host: stripWww(parsed.hostname),
  title: null,
  description: null,
  image: null,
  favicon: faviconForHost(parsed.hostname),
});

const parseOgPreview = (
  html: string,
  rawUrl: string,
  resolvedUrl: string,
  parsed: URL,
): LinkPreviewData => {
  const title = pick(html, [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:title["']/i,
    /<title[^>]*>([^<]{1,200})<\/title>/i,
  ]);

  const description = pick(html, [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
  ]);

  const rawImage = pick(html, [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ]);

  const rawFavicon = pick(html, [
    /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*icon[^"']*["']/i,
  ]);

  const faviconFromHtml = resolveUrl(resolvedUrl, rawFavicon);

  return {
    url: rawUrl,
    host: stripWww(parsed.hostname),
    title: title ?? null,
    description: description ?? null,
    image: resolveUrl(resolvedUrl, rawImage),
    favicon: faviconFromHtml ?? faviconForHost(parsed.hostname),
  };
};

export const getLinkPreview = async (rawUrl: string): Promise<LinkPreviewData> => {
  const parsed = assertPublicUrl(rawUrl);

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(rawUrl, {
      signal: ac.signal,
      headers: {
        'User-Agent': 'WhisperWaveBot/1.0 (link preview; +https://whisperwave.app)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new AppError(502, `Target URL returned ${response.status}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) {
      return minimalPreview(rawUrl, parsed);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new AppError(502, 'No response body');

    const html = await readLimitedHtml(reader);
    return parseOgPreview(html, rawUrl, response.url, parsed);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(502, 'Failed to fetch URL');
  } finally {
    clearTimeout(timer);
  }
};
