const TRAILING_PUNCT_RE = /[),.;!?]+$/;

/** URLs with explicit http(s) scheme. */
const PROTOCOL_URL_RE = /https?:\/\/[^\s<>"'`{}|\\^[\]]+/gi;

/**
 * Bare domains like github.com/user — at line start or after whitespace/(
 * (avoids matching the domain part of an email address).
 */
const BARE_DOMAIN_URL_RE =
  /(?:^|(?<=[\s(]))((?:www\.)?(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?::\d{1,5})?(?:\/[^\s<>"'`{}|\\^[\]]*)?)/gi;

export type ParsedLink = {
  url: string;
  host: string;
  path: string;
  /** URL without protocol — used as preview subtitle like WhatsApp. */
  displayUrl: string;
};

export type TextPart =
  | { type: 'text'; value: string }
  | { type: 'url'; value: string; href: string };

type UrlSpan = { index: number; raw: string };

const trimTrailingPunctuation = (raw: string) => raw.replace(TRAILING_PUNCT_RE, '');

const spansOverlap = (a: UrlSpan, b: UrlSpan) =>
  a.index < b.index + b.raw.length && b.index < a.index + a.raw.length;

const findUrlSpans = (text: string): UrlSpan[] => {
  const spans: UrlSpan[] = [];

  for (const match of text.matchAll(PROTOCOL_URL_RE)) {
    if (match.index === undefined) continue;
    spans.push({ index: match.index, raw: trimTrailingPunctuation(match[0]) });
  }

  for (const match of text.matchAll(BARE_DOMAIN_URL_RE)) {
    if (match.index === undefined || !match[1]) continue;
    const raw = trimTrailingPunctuation(match[1]);
    const span = { index: match.index, raw };
    if (!spans.some((existing) => spansOverlap(existing, span))) {
      spans.push(span);
    }
  }

  return spans.sort((a, b) => a.index - b.index);
};

export const withHttpsProtocol = (raw: string): string => {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export const parseLink = (rawUrl: string): ParsedLink => {
  const display = trimTrailingPunctuation(rawUrl);
  const url = withHttpsProtocol(display);

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const pathWithQuery = `${parsed.pathname}${parsed.search}`.replace(/\/$/, '');
    const path = pathWithQuery && pathWithQuery !== '' ? pathWithQuery : host;
    const displayUrl = display.replace(/^https?:\/\//i, '').replace(/^www\./i, '');

    return { url, host, path, displayUrl };
  } catch {
    return { url, host: display, path: '', displayUrl: display };
  }
};

export const extractLinksFromText = (text = ''): ParsedLink[] => {
  const seen = new Set<string>();
  const links: ParsedLink[] = [];

  for (const { raw } of findUrlSpans(text)) {
    const parsed = parseLink(raw);
    if (seen.has(parsed.url)) continue;
    seen.add(parsed.url);
    links.push(parsed);
  }

  return links;
};

export const isLinkOnlyMessage = (text = ''): boolean => {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const links = extractLinksFromText(trimmed);
  if (links.length !== 1) return false;
  const link = links[0];
  return (
    trimmed === link.displayUrl ||
    trimmed === link.url ||
    trimmed === withHttpsProtocol(trimmed)
  );
};

export const splitTextByUrls = (text: string): TextPart[] => {
  const spans = findUrlSpans(text);
  if (spans.length === 0) return [{ type: 'text', value: text }];

  const parts: TextPart[] = [];
  let lastIndex = 0;

  for (const { index, raw } of spans) {
    if (index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, index) });
    }
    parts.push({
      type: 'url',
      value: raw,
      href: parseLink(raw).url,
    });
    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
};

export const getLinkFaviconUrl = (url: string): string | undefined => {
  try {
    const host = new URL(withHttpsProtocol(url)).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  } catch {
    return undefined;
  }
};
