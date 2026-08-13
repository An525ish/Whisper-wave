import { useSocket } from '@/socket/SocketProvider';
import useSocketEvent from '@/shared/hooks/useSocketEvent';
import {
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  NEW_REQUEST,
  ONLINE_USERS,
  START_TYPING,
  STOP_TYPING,
  USER_OFFLINE,
  USER_ONLINE,
} from '@/shared/constants/socketEvents';
import { useNotificationsStore } from '@/features/notifications/store';
import { usePresenceStore } from '@/features/chat/stores/presence';
import { useProfileUiStore } from '@/features/profile/store';
import Title from '@/shared/components/Title';
import ChatListPanel from '@/features/chat/components/list/ChatListPanel';
import ProfileHeader from '@/features/profile/components/ProfileHeader';
import ProfilePanel from '@/features/profile/components/ProfilePanel';
import ProfileSheet from '@/features/profile/components/ProfileSheet';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';

type AppWrapperProps = {
  children: ReactNode;
};

type NewMessageAlertPayload = {
  chatId: string;
};

type OnlineUsersPayload = {
  userIds: string[];
};

type UserPresencePayload = {
  userId: string;
  lastSeen?: string;
};

type TypingPayload = {
  chatId: string;
};

type NewMessagePayload = {
  chatId: string;
};

const TYPING_STALE_MS = 3500;

const AppWrapper = ({ children }: AppWrapperProps) => {
  const socket = useSocket();
  const { chatId } = useParams();
  const isChatOpen = Boolean(chatId);
  const isNarrowProfile = useMediaQuery('(max-width: 1023px)');
  const viewSelfProfile = useProfileUiStore((s) => s.viewSelfProfile);
  const closeSelfProfile = useProfileUiStore((s) => s.closeSelfProfile);
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
    return () => {
      for (const timeout of typingTimeoutsRef.current.values()) {
        clearTimeout(timeout);
      }
      typingTimeoutsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    closeSelfProfile();
  }, [chatId, closeSelfProfile]);

  const newMessageAlertHandler = useCallback(
    (res: NewMessageAlertPayload) => {
      if (res.chatId === chatId) return;
      addMessageNotification({ chatId: res.chatId });
    },
    [addMessageNotification, chatId],
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

  const events = useMemo(
    () => ({
      [NEW_MESSAGE_ALERT]: newMessageAlertHandler,
      [NEW_REQUEST]: newRequestHandler,
      [ONLINE_USERS]: onlineUsersHandler,
      [USER_ONLINE]: userOnlineHandler,
      [USER_OFFLINE]: userOfflineHandler,
      [START_TYPING]: startTypingHandler,
      [STOP_TYPING]: stopTypingHandler,
      [NEW_MESSAGE]: newMessageHandler,
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
    ],
  );

  useSocketEvent(socket, events as Parameters<typeof useSocketEvent>[1]);

  return (
    <>
      <Title />

      <main className="flex h-dvh min-h-0 gap-0 overflow-hidden p-0 pb-[env(safe-area-inset-bottom)] md:gap-2 md:px-3 md:pb-2 md:pt-1.5 lg:gap-3 lg:px-4 lg:pb-3 lg:pt-2">
        {/* Phone/tablet portrait: one pane. md+: list + chat. lg+: + profile. */}
        <aside
          className={`min-h-0 min-w-0 flex-1 bg-background md:rounded-xl md:bg-transparent ${
            isChatOpen ? 'hidden md:block' : 'block'
          }`}
        >
          <ChatListPanel />
        </aside>

        <section
          className={`min-h-0 min-w-0 flex-col ${
            isChatOpen
              ? 'flex flex-1 md:flex-[2]'
              : 'hidden md:flex md:flex-[2]'
          }`}
        >
          {children}
        </section>

        <aside className="relative hidden min-h-0 min-w-0 flex-1 lg:flex lg:flex-col">
          <ProfileHeader />
          <ProfilePanel />
        </aside>
      </main>

      <ProfileSheet
        open={viewSelfProfile && isNarrowProfile}
        onClose={closeSelfProfile}
        forceSelf
        title="Edit profile"
      />
    </>
  );
};

export default AppWrapper;
