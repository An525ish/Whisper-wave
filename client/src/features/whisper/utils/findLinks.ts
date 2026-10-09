const URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/gi;

/** Sentence punctuation that trails a pasted link but is not part of it. */
const TRAILING_PUNCTUATION = /[.,;:!?)\]}]+$/;

type FoundLink = {
  /** Offsets into the text, covering the link without trailing punctuation. */
  start: number;
  end: number;
  /** The normalised URL — only ever `http:` or `https:`. */
  href: string;
};

/**
 * Every http(s) link in a piece of text.
 *
 * The one place that decides what counts as a link, so the "Shared links" panel
 * and the tappable links in a bubble can never disagree. Anything that is not
 * `http`/`https` (`javascript:`, `data:`, …) is never returned.
 */
export const findLinks = (content: string): FoundLink[] => {
  const found: FoundLink[] = [];

  for (const match of content.matchAll(URL_PATTERN)) {
    const raw = match[0].replace(TRAILING_PUNCTUATION, '');
    let parsed: URL;
    try {
      parsed = new URL(raw);
    } catch {
      continue;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') continue;

    const start = match.index ?? 0;
    found.push({ start, end: start + raw.length, href: parsed.href });
  }

  return found;
};
