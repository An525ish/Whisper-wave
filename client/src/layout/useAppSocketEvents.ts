import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSocket } from '@/shared/lib/socket/SocketProvider';
import useSocketEvent from '@/shared/hooks/useSocketEvent';
import { SOCKET_EVENTS } from '@/shared/constants/socket';
import { TYPING_STALE_MS } from '@/shared/constants/app';
import { useNotificationsStore } from '@/features/notifications';
import { usePresenceStore } from '@/features/chat';
import { useWhisperConnectionReady } from '@/features/whisper';
import type {
  NewMessageAlertPayload,
  OnlineUsersPayload,
  TypingPayload,
  UserPresencePayload,
} from '@/shared/types/socket';

interface Params {
  /**
   * The open conversation to stay quiet for — an alert for this chat is
   * already visible, so notifying would double-ping. Stale values double
   * notify, so the caller passes the live route param on every render.
   */
  suppressedChatId?: string;
}

// A NEW_MESSAGE socket frame carries more, but here we only read chatId to
// clear the typing indicator. The full payload is a chat-domain type.
type NewMessagePayload = {
  chatId: string;
};

/**
 * App-wide realtime subscriptions: notifications, presence and typing.
 *
 * Mounted once by the hub shell for signed-in users. Owns the typing stale
 * timers (with unmount cleanup, so StrictMode double-mounts are safe) and
 * subscribes through `useSocketEvent`'s ref indirection, so handler identity
 * churn never re-subscribes the socket.
 */
export function useAppSocketEvents({ suppressedChatId }: Params): void {
  const socket = useSocket();
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const addMessageNotification = useNotificationsStore(
    (s) => s.addMessageNotification,
  );
  const addRequestNotification = useNotificationsStore(
    (s) => s.addRequestNotification,
  );
  const setOnlineUsers = usePresenceStore((s) => s.setOnlineUsers);
  const setUserOnline = usePresenceStore((s) => s.setUserOnline);
  const setUserOffline = usePresenceStore((s) => s.setUserOffline);
  const setChatTyping = usePresenceStore((s) => s.setChatTyping);

  const clearTypingTimer = useCallback((id: string) => {
    const existing = typingTimeoutsRef.current.get(id);
    if (existing) {
      clearTimeout(existing);
      typingTimeoutsRef.current.delete(id);
    }
  }, []);

  const markTyping = useCallback(
    (id: string, isTyping: boolean) => {
      clearTypingTimer(id);
      setChatTyping(id, isTyping);
      if (!isTyping) return;

      const timeout = setTimeout(() => {
        setChatTyping(id, false);
        typingTimeoutsRef.current.delete(id);
      }, TYPING_STALE_MS);
      typingTimeoutsRef.current.set(id, timeout);
    },
    [clearTypingTimer, setChatTyping],
  );

  useEffect(() => {
    const timeouts = typingTimeoutsRef.current;
    return () => {
      for (const timeout of timeouts.values()) {
        clearTimeout(timeout);
      }
      timeouts.clear();
    };
  }, []);

  const newMessageAlertHandler = useCallback(
    (res: NewMessageAlertPayload) => {
      if (res.chatId === suppressedChatId) return;
      addMessageNotification({ chatId: res.chatId });
    },
    [addMessageNotification, suppressedChatId],
  );

  const newRequestHandler = useCallback(() => {
    addRequestNotification();
  }, [addRequestNotification]);

  const onlineUsersHandler = useCallback(
    (res: OnlineUsersPayload) => {
      setOnlineUsers(res.userIds ?? []);
    },
    [setOnlineUsers],
  );

  const userOnlineHandler = useCallback(
    (res: UserPresencePayload) => {
      if (res.userId) setUserOnline(res.userId);
    },
    [setUserOnline],
  );

  const userOfflineHandler = useCallback(
    (res: UserPresencePayload) => {
      if (res.userId) setUserOffline(res.userId, res.lastSeen);
    },
    [setUserOffline],
  );

  const startTypingHandler = useCallback(
    (res: TypingPayload) => {
      if (!res.chatId) return;
      markTyping(res.chatId, true);
    },
    [markTyping],
  );

  const stopTypingHandler = useCallback(
    (res: TypingPayload) => {
      if (!res.chatId) return;
      markTyping(res.chatId, false);
    },
    [markTyping],
  );

  const newMessageHandler = useCallback(
    (res: NewMessagePayload) => {
      if (!res.chatId) return;
      markTyping(res.chatId, false);
    },
    [markTyping],
  );

  // A Whisper anon match became a real DM while this user was elsewhere.
  const whisperConnectionReadyHandler = useWhisperConnectionReady();

  const events = useMemo(
    () => ({
      [SOCKET_EVENTS.NEW_MESSAGE_ALERT]: newMessageAlertHandler,
      [SOCKET_EVENTS.NEW_REQUEST]: newRequestHandler,
      [SOCKET_EVENTS.ONLINE_USERS]: onlineUsersHandler,
      [SOCKET_EVENTS.USER_ONLINE]: userOnlineHandler,
      [SOCKET_EVENTS.USER_OFFLINE]: userOfflineHandler,
      [SOCKET_EVENTS.START_TYPING]: startTypingHandler,
      [SOCKET_EVENTS.STOP_TYPING]: stopTypingHandler,
      [SOCKET_EVENTS.NEW_MESSAGE]: newMessageHandler,
      [SOCKET_EVENTS.WHISPER_CONNECTION_READY]: whisperConnectionReadyHandler,
    }),
    [
      newMessageAlertHandler,
      newRequestHandler,
      onlineUsersHandler,
      userOnlineHandler,
      userOfflineHandler,
      startTypingHandler,
      stopTypingHandler,
      newMessageHandler,
      whisperConnectionReadyHandler,
    ],
  );

  useSocketEvent(socket, events as Parameters<typeof useSocketEvent>[1]);
}
