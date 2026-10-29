import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import type { LinkPreviewData } from '../../types/linkPreview.js';
import { AppError } from '../../utils/AppError.js';

const MAX_BYTES = 200_000;
const TIMEOUT_MS = 6_000;

const MAX_REDIRECTS = 3;

/** Loopback, private, link-local (cloud metadata 169.254.x), CGNAT, ULA and unspecified addresses. */
const PRIVATE_ADDR =
  /^(0\.|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.|::1?$|f[cd][0-9a-f]{2}:|fe80:|::ffff:)/i;
const PRIVATE_NAME = /^(localhost|.*\.(local|internal|localhost))$/i;

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

  if (PRIVATE_NAME.test(parsed.hostname) || PRIVATE_ADDR.test(parsed.hostname.replace(/^\[|\]$/g, ''))) {
    throw new AppError(400, 'Private URLs are not allowed');
  }

  return parsed;
};

/**
 * Resolve the host and refuse if ANY address is non-public, so a public-looking name
 * that points at 127.0.0.1 or the cloud metadata IP is rejected.
 * ponytail: resolve-then-fetch leaves a small DNS-rebinding window. Upgrade: pin the
 * resolved IP in a custom undici dispatcher.
 */
const assertPublicHost = async (parsed: URL): Promise<void> => {
  const host = parsed.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host)) return; // already checked by assertPublicUrl
  let addrs: { address: string }[];
  try {
    addrs = await lookup(host, { all: true });
  } catch {
    throw new AppError(502, 'Failed to fetch URL');
  }
  if (addrs.length === 0 || addrs.some((a) => PRIVATE_ADDR.test(a.address))) {
    throw new AppError(400, 'Private URLs are not allowed');
  }
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
    // Redirects are followed by hand so every hop is re-checked against the private ranges.
    let target = parsed;
    let response: Response;
    for (let hop = 0; ; hop++) {
      await assertPublicHost(target);
      response = await fetch(target.href, {
        signal: ac.signal,
        headers: {
          'User-Agent': 'WhisperWaveBot/1.0 (link preview; +https://whisperwave.app)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'manual',
      });
      const location = response.status >= 300 && response.status < 400 ? response.headers.get('location') : null;
      if (!location) break;
      if (hop >= MAX_REDIRECTS) throw new AppError(502, 'Too many redirects');
      target = assertPublicUrl(new URL(location, target).href);
    }

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
    return parseOgPreview(html, rawUrl, target.href, parsed);
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(502, 'Failed to fetch URL');
  } finally {
    clearTimeout(timer);
  }
};
