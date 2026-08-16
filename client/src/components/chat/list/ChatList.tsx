import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import AvatarSkeleton from '@/components/ui/skeletons/AvatarSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import ChatListItem from '@/components/chat/list/ChatListItem';
import { useAuthStore } from '@/stores/auth';
import { usePresenceStore } from '@/stores/chat/presence';
import { normalizeMemberIds } from '@/utils/helpers';
import type { ChatListEntry } from '@/types/chat';

type ChatListProps = {
  chats?: ChatListEntry[];
  type: string;
  isLoading?: boolean;
};

const ChatList = ({
  chats = [],
  type,
  isLoading,
}: ChatListProps) => {
  const user = useAuthStore((s) => s.user);
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
  const typingChatIds = usePresenceStore((s) => s.typingChatIds);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const selfId = user?._id ? String(user._id) : '';
  const prevFirstIdRef = useRef<string | undefined>(undefined);

  // Scroll to top whenever the leading chat changes (new message reordered it).
  useEffect(() => {
    const firstId = chats[0]?._id;
    if (!firstId || firstId === prevFirstIdRef.current) return;
    prevFirstIdRef.current = firstId;
    if (parentRef.current) parentRef.current.scrollTop = 0;
  }, [chats]);

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
            const { avatar, name, _id, groupChat, members, lastMessage, unreadCount } =
              data;
            const peerIds = normalizeMemberIds(members).filter(
              (id) => id !== selfId,
            );
            const isOnline =
              !groupChat &&
              peerIds.some((id) => onlineUserIds.includes(id));
            const isTyping = Boolean(typingChatIds[_id]);

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
                  isTyping={isTyping}
                  unreadCount={unreadCount}
                  id={_id}
                  lastMessage={lastMessage}
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
