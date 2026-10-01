import { useSocket } from '@/shared/lib/socket/SocketProvider';
import useSocketEvent from '@/shared/hooks/useSocketEvent';
import { SOCKET_EVENTS } from '@/shared/constants/socket';
import { useNotificationsStore } from '@/features/notifications';
import { usePresenceStore } from '@/features/chat';
import { useProfileUiStore } from '@/features/profile';
import { useAuthStore } from '@/features/auth';
import { useWhisperConnectResume } from '@/features/whisper';
import { Title } from '@/features/notifications';
import { GhostBanner } from '@/features/auth';
import { ChatListPanel } from '@/features/chat';
import { ProfileHeader } from '@/features/profile';
import { ProfilePanel } from '@/features/profile';
import { ProfileSheet } from '@/features/profile';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { TYPING_STALE_MS } from '@/shared/constants/app';
import type {
  NewMessageAlertPayload,
  OnlineUsersPayload,
  UserPresencePayload,
  TypingPayload,
} from '@/shared/types/socket';
import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

type AppWrapperProps = {
  children: ReactNode;
};

// A NEW_MESSAGE socket frame carries more, but here we only read chatId to clear
// the typing indicator. The full payload is a chat-domain type in chat/types.
type NewMessagePayload = {
  chatId: string;
};

const AppWrapper = ({ children }: AppWrapperProps) => {
  const socket = useSocket();
  const navigate = useNavigate();
  const { chatId } = useParams();
  const isChatOpen = Boolean(chatId);

  // Finish a Whisper "connect & reveal" if the guest just signed in and landed
  // here (mounted in the authed shell, so it never touches the guest bundle).
  useWhisperConnectResume();
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

  // A Whisper anon match was upgraded to a real DM while this user was on
  // another screen (they signed in from the mutual-vibe prompt and completed
  // first). Drop them into the freshly created chat.
  const whisperConnectionReadyHandler = useCallback(
    (res: { chatId?: string }) => {
      if (!res.chatId) return;
      toast('You’re connected — say hi ✨');
      navigate(`/chat/${res.chatId}`);
    },
    [navigate],
  );

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

  const isImpersonated = useAuthStore((s) => s.isImpersonated);

  return (
    <>
      <Title />
      {isImpersonated && <GhostBanner />}

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
              ? 'flex flex-1 md:flex-2'
              : 'hidden md:flex md:flex-2'
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
