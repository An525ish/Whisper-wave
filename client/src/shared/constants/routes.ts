const URL_IN_TEXT = /https?:\/\/[^\s<>"'`{}|\\^[\]]+/gi;

export type ParsedLink = {
  url: string;
  host: string;
  path: string;
  /** URL without protocol — used as preview subtitle like WhatsApp. */
  displayUrl: string;
};

const trimTrailingPunctuation = (raw: string) => raw.replace(/[),.;!?]+$/g, '');

export const parseLink = (rawUrl: string): ParsedLink => {
  const url = trimTrailingPunctuation(rawUrl);

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const pathWithQuery = `${parsed.pathname}${parsed.search}`.replace(/\/$/, '');
    const path =
      pathWithQuery && pathWithQuery !== ''
        ? pathWithQuery
        : host;

    const displayUrl = url.replace(/^https?:\/\//i, '');

    return { url, host, path, displayUrl };
  } catch {
    return { url, host: url, path: '', displayUrl: url };
  }
};

export const extractLinksFromText = (text = ''): ParsedLink[] => {
  const matches = text.match(URL_IN_TEXT);
  if (!matches) return [];

  const seen = new Set<string>();
  const links: ParsedLink[] = [];

  for (const raw of matches) {
    const url = trimTrailingPunctuation(raw);
    if (seen.has(url)) continue;
    seen.add(url);
    links.push(parseLink(url));
  }

  return links;
};

export const isLinkOnlyMessage = (text = ''): boolean => {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const links = extractLinksFromText(trimmed);
  return links.length === 1 && links[0]?.url === trimmed;
};

export type TextPart = { type: 'text' | 'url'; value: string };

export const splitTextByUrls = (text: string): TextPart[] => {
  const parts: TextPart[] = [];
  const regex = new RegExp(URL_IN_TEXT.source, 'gi');
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({
      type: 'url',
      value: trimTrailingPunctuation(match[0]),
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', value: text }];
};

export const getLinkFaviconUrl = (url: string): string | undefined => {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  } catch {
    return undefined;
  }
};
