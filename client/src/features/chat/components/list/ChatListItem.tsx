import { memo } from 'react';
import AvatarCard from '@/shared/components/ui/AvatarCard';
import ReadReceipt from '@/shared/components/ui/icons/ReadReceipt';
import WaveIcon from '@/shared/components/ui/icons/Wave';
import { Link } from 'react-router-dom';
import { getFirstName, formatChatTime } from '@/shared/utils/helpers';
import CountBadge from '@/shared/components/ui/CountBadge';
import type { ChatLastMessage } from '@/features/chat/types/chat';
import { ROUTES } from '@/shared/constants/routes';

type ChatListItemProps = {
  avatar?: string[];
  name: string;
  id: string;
  isActive?: boolean;
  groupChat?: boolean;
  isOnline?: boolean;
  isTyping?: boolean;
  lastMessage?: ChatLastMessage | null;
  unreadCount?: number;
  currentUserId: string;
  /** Set when this DM began as an anonymous whisper match. */
  origin?: 'whisper' | null;
};

const ChatListItem = ({
  avatar = [],
  name,
  id,
  isActive = false,
  groupChat = false,
  isOnline = false,
  isTyping = false,
  lastMessage,
  unreadCount = 0,
  currentUserId,
  origin,
}: ChatListItemProps) => {
  const hasUnread = unreadCount > 0;
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
    <Link to={ROUTES.chat(id)} className="select-none">
      <div
        className={`flex cursor-pointer items-center gap-1 rounded-xl px-3 py-3.5 transition active:scale-[0.99] md:gap-2 md:rounded-lg md:p-4 gradient-border hover:bg-gradient-row-hover ${
          isActive
            ? 'bg-gradient-background'
            : hasUnread
              ? 'bg-primary/35'
              : ''
        }`}
      >
        <div className="relative overflow-visible">
          <AvatarCard avatars={avatar} showOnline={!groupChat && isOnline} />
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
              {origin === 'whisper' && (
                <span role="img" aria-label="Started on Whisper" className="mr-1 inline-flex align-middle">
                  <WaveIcon className="h-3.5 w-3.5 text-green" />
                </span>
              )}
              {name}
              {origin === 'whisper' && hasUnread && (
                <span className="ml-1.5 rounded-full bg-green/15 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-green">
                  New
                </span>
              )}
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
            <CountBadge count={unreadCount} className="ml-1" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default memo(ChatListItem);
