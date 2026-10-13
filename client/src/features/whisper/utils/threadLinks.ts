import { findLinks } from './findLinks';
import type { AnonMessage, ThreadLink } from '../types';

/**
 * Every distinct http(s) link in the thread, newest first.
 *
 * Anonymous chat is text-only, so "what we shared" means links. A link is listed
 * once however many times it was pasted. Failed sends are skipped: the partner
 * never got them.
 */
export const extractThreadLinks = (messages: AnonMessage[]): ThreadLink[] => {
  const seen = new Set<string>();
  const links: ThreadLink[] = [];

  for (const message of messages) {
    if (message.delivery === 'failed') continue;

    for (const { href } of findLinks(message.content)) {
      if (seen.has(href)) continue;

      seen.add(href);
      links.push({
        url: href,
        host: new URL(href).hostname.replace(/^www\./, ''),
        from: message.from,
        sentAt: message.sentAt,
      });
    }
  }

  return links.reverse();
};
