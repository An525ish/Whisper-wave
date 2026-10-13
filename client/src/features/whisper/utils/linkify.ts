import { findLinks } from './findLinks';

type TextSegment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; text: string; href: string };

/**
 * Split a message into plain text and tappable links, in order.
 *
 * Concatenating every segment's `text` gives back the original message exactly, so
 * nothing the sender typed is ever altered or hidden — a link is shown as written.
 */
export const linkify = (content: string): TextSegment[] => {
  const links = findLinks(content);
  if (links.length === 0) return [{ kind: 'text', text: content }];

  const segments: TextSegment[] = [];
  let cursor = 0;

  for (const { start, end, href } of links) {
    if (start > cursor) segments.push({ kind: 'text', text: content.slice(cursor, start) });
    segments.push({ kind: 'link', text: content.slice(start, end), href });
    cursor = end;
  }
  if (cursor < content.length) segments.push({ kind: 'text', text: content.slice(cursor) });

  return segments;
};
