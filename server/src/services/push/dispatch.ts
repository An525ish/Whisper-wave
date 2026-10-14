import {
  PUSH_BODY_ATTACHMENT,
  PUSH_BODY_FORWARD,
  PUSH_BODY_MESSAGE,
  PUSH_CONCURRENCY,
  PUSH_TAG_CONNECTION,
  PUSH_TAG_REQUEST,
  PUSH_TITLE_CONNECTION,
  PUSH_TITLE_REQUEST,
  PUSH_URL_CHATS,
  pushChatTag,
  pushChatUrl,
} from '../../constants/push.js';
import {
  modNeededBody,
  modNeededTag,
  modNeededTitle,
  roomOpenBody,
  roomOpenTag,
  roomOpenUrl,
} from '../../constants/roomReminders.js';
import { ROOM_MOD_NUDGE_THROTTLE_MS } from '../../constants/rooms.js';
import type { RealtimeNotify } from '../../types/chat.js';
import type {
  PushChatInfo,
  PushDispatchDeps,
  PushIntent,
  PushPayload,
} from '../../types/push.js';
import { logger } from '../../utils/logger.js';

/**
 * PRIVACY: a push travels through Google's servers, so it NEVER carries message
 * text. Messages say only "New message" / "Sent an attachment".
 */
export const buildMessagePayload = (
  chatId: string,
  intent: Extract<PushIntent, { kind: 'message' }>,
  chat: PushChatInfo | null
): PushPayload => ({
  title: chat?.groupChat ? `${intent.senderName} in ${chat.name}` : intent.senderName,
  body: intent.forwarded
    ? PUSH_BODY_FORWARD
    : intent.hasAttachment
      ? PUSH_BODY_ATTACHMENT
      : PUSH_BODY_MESSAGE,
  url: pushChatUrl(chatId),
  tag: pushChatTag(chatId),
  urgent: true,
});

export const buildRequestPayload = (senderName: string): PushPayload => ({
  title: PUSH_TITLE_REQUEST,
  body: `${senderName} wants to connect`,
  url: PUSH_URL_CHATS,
  tag: PUSH_TAG_REQUEST,
  urgent: false,
});

export const buildConnectionPayload = (displayName: string): PushPayload => ({
  title: PUSH_TITLE_CONNECTION,
  body: `${displayName} is now in your chats`,
  url: PUSH_URL_CHATS,
  tag: PUSH_TAG_CONNECTION,
  urgent: false,
});

export const buildRoomOpenPayload = (slug: string, title: string): PushPayload => ({
  title,
  body: roomOpenBody(title),
  url: roomOpenUrl(slug),
  tag: roomOpenTag(slug),
  urgent: false,
});

/** Counts only — no identities, no message text (the push crosses Google's servers). */
export const buildModNeededPayload = (slug: string, title: string, waiting: number): PushPayload => ({
  title: modNeededTitle(title),
  body: modNeededBody(waiting),
  url: roomOpenUrl(slug),
  tag: modNeededTag(slug),
  urgent: false,
});

/** Offline recipients only, sender excluded, de-duplicated. */
export const selectRecipients = (
  candidates: string[],
  excludeUserId: string | undefined,
  isOnline: (userId: string) => boolean
): string[] =>
  [...new Set(candidates)].filter((id) => id !== excludeUserId && !isOnline(id));

const mapWithConcurrency = async <T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>
): Promise<void> => {
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) await fn(items[next++]);
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
};

export const createPushDispatcher = (deps: PushDispatchDeps) => {
  const sendToUsers = async (
    userIds: string[],
    payload: PushPayload,
    throttleMs?: number
  ): Promise<void> => {
    const allowed = userIds.filter((id) => deps.throttle.allow(id, payload.tag, throttleMs));
    const tokens = await deps.loadTokens(allowed);
    const dead: string[] = [];
    await mapWithConcurrency(tokens, PUSH_CONCURRENCY, async (token) => {
      if ((await deps.sender.send(token, payload)) === 'invalid-token') dead.push(token);
    });
    await deps.removeTokens(dead);
  };

  const dispatchOne = async (
    n: RealtimeNotify,
    isOnline: (userId: string) => boolean
  ): Promise<void> => {
    const { push } = n;
    if (!push) return;

    if (push.kind === 'room-open') {
      const recipients = selectRecipients((n.members ?? []).map(String), n.excludeUserId, isOnline);
      if (recipients.length) await sendToUsers(recipients, buildRoomOpenPayload(push.slug, push.title));
      return;
    }

    if (push.kind === 'mod-needed') {
      // Mods get this wherever they are in the app: presence is NOT a filter.
      const recipients = [...new Set((n.members ?? []).map(String))];
      if (recipients.length) {
        await sendToUsers(
          recipients,
          buildModNeededPayload(push.slug, push.title, push.waiting),
          ROOM_MOD_NUDGE_THROTTLE_MS
        );
      }
      return;
    }

    if (push.kind === 'request' || push.kind === 'connection') {
      const recipients = selectRecipients(
        (n.members ?? []).map(String),
        n.excludeUserId,
        isOnline
      );
      if (recipients.length) await sendToUsers(
          recipients,
          push.kind === 'request'
            ? buildRequestPayload(push.senderName)
            : buildConnectionPayload(push.displayName)
        );
      return;
    }

    if (!n.chatId) return;
    const chat = await deps.loadChat(n.chatId);
    if (!chat) return;
    const recipients = selectRecipients(chat.members, n.excludeUserId, isOnline);
    if (recipients.length) {
      await sendToUsers(recipients, buildMessagePayload(n.chatId, push, chat));
    }
  };

  /** Fire-and-forget: resolves after sending, never rejects. */
  const dispatch = async (
    notifications: RealtimeNotify[],
    isOnline: (userId: string) => boolean
  ): Promise<void> => {
    if (!deps.enabled) return;
    for (const n of notifications) {
      try {
        await dispatchOne(n, isOnline);
      } catch (err) {
        logger.warn({ err }, 'push dispatch failed');
      }
    }
  };

  return { dispatch };
};
