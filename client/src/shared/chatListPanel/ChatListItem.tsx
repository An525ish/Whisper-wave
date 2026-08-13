import ContextMenu from '@/components/context-menu/ContextMenu';
import AvatarCard from '@/components/ui/AvatarCard';
import ChatIcon from '@/components/icons/Chat';
import ReadReceipt from '@/components/icons/ReadReceipt';
import useContextMenu from '@/hooks/Context-menu';
import type { MouseEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getFirstName } from '@/utils/helper';
import { formatUnreadCount } from '@/utils/unread';

dayjs.extend(relativeTime);

type ChatListItemLastMessage = {
  content?: string;
  createdAt?: string;
  isRead?: boolean;
  sender?: {
    _id: string;
    name?: string;
  };
};

type ChatListItemProps = {
  avatar?: string[];
  name: string;
  id: string;
  groupChat?: boolean;
  isOnline?: boolean;
  isTyping?: boolean;
  lastMessage?: ChatListItemLastMessage | null;
  unreadCount?: number;
  currentUserId: string;
  onMarkRead?: (chatId: string) => void;
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
  onMarkRead,
}: ChatListItemProps) => {
  const { menuState, showContextMenu, hideContextMenu } = useContextMenu();
  const { chatId } = useParams();
  const navigate = useNavigate();
  const hasUnread = unreadCount > 0;
  const isActive = chatId === id;
  const senderId = lastMessage?.sender?._id
    ? String(lastMessage.sender._id)
    : '';
  const isOwnLastMessage = Boolean(
    senderId && senderId === String(currentUserId),
  );
  const showTicks = isOwnLastMessage && !isTyping;

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const options = [
      {
        id: 1,
        icon: <ChatIcon className="h-4 w-4" />,
        name: 'Open Conversation',
      },
      ...(hasUnread
        ? [
            {
              id: 3,
              icon: <ReadReceipt read />,
              name: 'Mark as read',
            },
          ]
        : []),
      {
        id: 2,
        icon: '/icons/clear.svg',
        name: 'Clear Message',
      },
    ];

    showContextMenu({ x: e.clientX, y: e.clientY }, options, (option) => {
      if (option.name === 'Open Conversation') {
        navigate(`/chat/${id}`);
        return;
      }
      if (option.name === 'Mark as read') {
        onMarkRead?.(id);
      }
    });
  };

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

  const formatTime = (time?: string) => {
    if (!time) return '';
    const messageDate = dayjs(time);
    const now = dayjs();

    if (messageDate.isSame(now, 'day')) {
      return messageDate.format('hh:mm A');
    }
    if (messageDate.isSame(now.subtract(1, 'day'), 'day')) {
      return 'Yesterday';
    }
    if (messageDate.isSame(now, 'week')) {
      return messageDate.format('ddd');
    }
    if (messageDate.isSame(now, 'year')) {
      return messageDate.format('D MMM');
    }
    return messageDate.format('D MMM, YYYY');
  };

  return (
    <>
      <Link to={`/chat/${id}`} onContextMenu={handleContextMenu}>
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
                {formatTime(lastMessage?.createdAt)}
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
      <ContextMenu menuState={menuState} hideContextMenu={hideContextMenu} />
    </>
  );
};

export default ChatListItem;
