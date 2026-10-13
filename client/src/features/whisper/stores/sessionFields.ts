import type { AnonMessage, VibeTag } from '../types';

/** Everything that belongs to a single match and must not survive into the next. */
export const sessionFields = {
  sessionId: null as string | null,
  partnerName: null as string | null,
  partnerTags: [] as VibeTag[],
  likeSent: false,
  mutualLike: false,
  connectToken: null as string | null,
  mutualAt: null as number | null,
  mutualVibeDismissed: false,
  partnerVibed: false,
  matchedAt: null as number | null,
  sessionAlias: null as string | null,
  sessionTags: null as VibeTag[] | null,
  partnerLeftPromptDismissed: false,
  endedAt: null as number | null,
  sessionEndTracked: false,
  messages: [] as AnonMessage[],
  chatId: null as string | null,
  connectionId: null as string | null,
  queueSize: null as number | null,
} as const;
