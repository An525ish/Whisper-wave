import { useRef, type MouseEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import AvatarSkeleton from '@/components/skeletons/AvatarSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import ChatListItem from './ChatListItem';
import { useAuthStore } from '@/stores/auth';
import type { MessageNotification } from '@/types';

type ChatLastMessage = {
  content?: string;
  createdAt?: string;
  sender?: {
    _id: string;
    name?: string;
  };
};

type ChatListEntry = {
  _id: string;
  name?: string;
  avatar?: string | string[];
  groupChat?: boolean;
  members?: string[];
  lastMessage?: ChatLastMessage | null;
};

type ChatListProps = {
  chats?: ChatListEntry[];
  type: string;
  isLoading?: boolean;
  onlineUsers?: string[];
  newMessageAlert: MessageNotification[];
  handleDeleteChat: (
    e: MouseEvent,
    _id: string,
    groupChat?: boolean,
  ) => void;
};

const ChatList = ({
  chats = [],
  type,
  isLoading,
  onlineUsers = [],
  newMessageAlert,
  handleDeleteChat,
}: ChatListProps) => {
  const user = useAuthStore((s) => s.user);
  const parentRef = useRef<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: chats.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    gap: 8,
    overscan: 6,
  });

  return (
    <div
      ref={parentRef}
      className="flex h-full min-h-0 flex-col gap-2 overflow-y-auto p-2 scrollbar-hide"
    >
      {isLoading ? (
        Array(8)
          .fill(0)
          .map((_, i) => (
            <AvatarSkeleton key={i} className={'px-4 py-2 h-20'} />
          ))
      ) : chats.length !== 0 ? (
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((item) => {
            const data = chats[item.index];
            const { avatar, name, _id, groupChat, members, lastMessage } =
              data;
            const messageAlert = newMessageAlert.find(
              ({ chatId }) => chatId === _id,
            );
            const isOnline = members?.some(() =>
              onlineUsers.includes(_id),
            );

            return (
              <div
                key={_id}
                data-index={item.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 top-0 w-full"
                style={{
                  transform: `translateY(${item.start}px)`,
                }}
              >
                <ChatListItem
                  avatar={Array.isArray(avatar) ? avatar : avatar ? [avatar] : []}
                  name={name ?? ''}
                  groupChat={groupChat}
                  isOnline={isOnline}
                  messageAlert={messageAlert}
                  id={_id}
                  lastMessage={lastMessage}
                  handleDeleteChat={handleDeleteChat}
                  currentUserId={user?._id ?? ''}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          className="h-full mb-20"
          imageSrc={`/images/no-${type}-chat.svg`}
          imageClassName="mx-auto opacity-45 w-4/5"
          titleClassName="text-body-300 text-center text-xl font-medium mt-12"
          title={`No ${type === 'allchats' ? '' : type} chats found`}
        />
      )}
    </div>
  );
};

export default ChatList;
