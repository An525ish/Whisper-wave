import { useSocket } from '@/socket/SocketProvider';
import useSocketEvent from '@/hooks/socketEvent';
import { NEW_MESSAGE_ALERT, NEW_REQUEST } from '@/lib/socketConstants';
import { useNotificationsStore } from '@/stores/notifications';
import Title from '@/shared/Title';
import ChatListPanel from '@/shared/chatListPanel/ChatListPanel';
import ProfileHeader from '@/shared/profilePanel/ProfileHeader';
import ProfilePanel from '@/shared/profilePanel/ProfilePanel';
import { useCallback, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';

type AppWrapperProps = {
  children: ReactNode;
};

type NewMessageAlertPayload = {
  chatId: string;
};

const AppWrapper = ({ children }: AppWrapperProps) => {
  const socket = useSocket();
  const { chatId } = useParams();
  const isChatOpen = Boolean(chatId);

  const addMessageNotification = useNotificationsStore(
    (s) => s.addMessageNotification,
  );
  const addRequestNotification = useNotificationsStore(
    (s) => s.addRequestNotification,
  );

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

  const events = {
    [NEW_MESSAGE_ALERT]: newMessageAlertHandler,
    [NEW_REQUEST]: newRequestHandler,
  };

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
    </>
  );
};

export default AppWrapper;
