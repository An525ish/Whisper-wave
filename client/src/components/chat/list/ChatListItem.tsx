import AvatarCard from '@/components/ui/AvatarCard';
import ReadReceipt from '@/components/ui/icons/ReadReceipt';
import { Link, useParams } from 'react-router-dom';
import { getFirstName, formatChatTime } from '@/utils/helpers';
import { formatUnreadCount } from '@/utils/chat';
import type { ChatLastMessage } from '@/types/chat';

type ChatListItemProps = {
  avatar?: string[];
  name: string;
  id: string;
  groupChat?: boolean;
  isOnline?: boolean;
  isTyping?: boolean;
  lastMessage?: ChatLastMessage | null;
  unreadCount?: number;
  currentUserId: string;
};

const ChatListItem = ({
  avatar = [],
  name,
  id,
  groupChat = false,
  isOnline = false,
  isTyping = false,
  lastMessage,
  unreadCount = 0,
  currentUserId,
}: ChatListItemProps) => {
  const { chatId } = useParams();
  const hasUnread = unreadCount > 0;
  const isActive = chatId === id;
  const senderId = lastMessage?.sender?._id
    ? String(lastMessage.sender._id)
    : '';
  const isOwnLastMessage = Boolean(
    senderId && senderId === String(currentUserId),
  );
  const showTicks = isOwnLastMessage && !isTyping;

  const renderLastMessagePreview = () => {
    if (isTyping) return 'typing…';
    if (!lastMessage) return 'No messages yet';
    const senderName = getFirstName(lastMessage.sender?.name ?? '');

    let senderPrefix = '';
    if (groupChat && lastMessage.sender) {
      senderPrefix =
        lastMessage.sender._id === currentUserId
          ? 'You: '
          : `${senderName}: `;
    } else if (isOwnLastMessage) {
      senderPrefix = 'You: ';
    }

    return `${senderPrefix}${lastMessage.content}`;
  };

  return (
    <Link to={`/chat/${id}`} className="select-none">
      <div
        className={`flex cursor-pointer items-center gap-1 rounded-xl px-3 py-3.5 transition active:scale-[0.99] md:gap-2 md:rounded-lg md:p-4 gradient-border hover:bg-gradient-background ${
          isActive
            ? 'bg-gradient-background'
            : hasUnread
              ? 'bg-primary/35'
              : ''
        }`}
      >
        <div className="relative">
          <AvatarCard avatars={avatar} />
          {!groupChat && isOnline ? (
            <span
              className="absolute bottom-0.5 right-1.5 h-3 w-3 rounded-full border-2 border-background bg-green md:bottom-1 md:right-2"
              aria-hidden
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={`min-w-0 flex-1 truncate text-[15px] md:text-base ${
                hasUnread
                  ? 'font-semibold text-white'
                  : 'font-medium text-body'
              }`}
            >
              {name}
            </p>
            <p
              className={`shrink-0 whitespace-nowrap text-[11px] md:text-xs ${
                hasUnread ? 'font-medium text-green' : 'text-body-300'
              }`}
            >
              {formatChatTime(lastMessage?.createdAt)}
            </p>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2 md:mt-1">
            <div className="flex min-w-0 flex-1 items-center overflow-hidden">
              <p
                className={`min-w-0 truncate text-[13px] md:text-sm ${
                  isTyping
                    ? 'font-medium text-green'
                    : hasUnread
                      ? 'font-medium text-body'
                      : 'text-body-700'
                }`}
              >
                {renderLastMessagePreview()}
              </p>
              {showTicks ? (
                <span
                  className="ml-1 inline-flex shrink-0 items-center"
                  aria-label={lastMessage?.isRead ? 'Read' : 'Sent'}
                >
                  <ReadReceipt read={Boolean(lastMessage?.isRead)} />
                </span>
              ) : null}
            </div>
            {hasUnread ? (
              <div className="ml-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border border-blue-light bg-blue/20 px-1 text-[11px] font-medium tabular-nums text-blue">
                {formatUnreadCount(unreadCount)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ChatListItem;
