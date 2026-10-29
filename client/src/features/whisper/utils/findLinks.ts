import { splitTextByUrls } from '@/features/chat';

type FoundLink = {
  /** Offsets into the text, covering the link without trailing punctuation. */
  start: number;
  end: number;
  /** The normalised URL, only ever `http:` or `https:`. */
  href: string;
};

/**
 * Every link in a piece of text.
 *
 * Delegates to the main chat's parser so both chats agree on what a link is,
 * including bare domains like `github.com/user` and `www.site.com`. This stays the
 * one place the anon side decides, so the "Links" panel and the tappable links in a
 * bubble can never disagree. Anything that is not `http`/`https` is never returned.
 */
export const findLinks = (content: string): FoundLink[] => {
  const found: FoundLink[] = [];
  let cursor = 0;

  for (const part of splitTextByUrls(content)) {
    const start = cursor;
    cursor += part.value.length;
    if (part.type !== 'url') continue;
    try {
      const { protocol, href } = new URL(part.href);
      if (protocol === 'http:' || protocol === 'https:') found.push({ start, end: cursor, href });
    } catch {
      // Not a valid URL after all: leave it as plain text.
    }
  }

  return found;
};
