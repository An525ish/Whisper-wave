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

      <main className="flex gap-4 h-dvh min-h-0 p-4 overflow-hidden">
        <div className="flex-1 min-h-0 min-w-0 rounded-lg hidden sm:block">
          <ChatListPanel />
        </div>

        <div className="flex-[2] min-h-0 min-w-0 flex flex-col">{children}</div>

        <div className="relative flex-1 min-h-0 min-w-0 hidden lg:flex lg:flex-col">
          <ProfileHeader />
          <ProfilePanel />
        </div>
      </main>
    </>
  );
};

export default AppWrapper;
