import ContextMenu from '@/components/context-menu/ContextMenu';
import AvatarCard from '@/components/ui/AvatarCard';
import useContextMenu from '@/hooks/Context-menu';
import type { MouseEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getFirstName } from '@/utils/helper';
import type { MessageNotification } from '@/types';

dayjs.extend(relativeTime);

type ChatListItemLastMessage = {
  content?: string;
  createdAt?: string;
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
  handleDeleteChat?: (
    e: MouseEvent,
    memberId: string,
    groupChat?: boolean,
  ) => void;
  lastMessage?: ChatListItemLastMessage | null;
  messageAlert?: MessageNotification;
  currentUserId: string;
};

const options = [
  {
    id: 1,
    icon: '/icons/chat-icon.svg',
    name: 'Open Conversation',
  },
  {
    id: 2,
    icon: '/icons/clear.svg',
    name: 'Clear Message',
  },
];

const ChatListItem = ({
  avatar = [],
  name,
  id,
  groupChat = false,
  lastMessage,
  messageAlert,
  currentUserId,
}: ChatListItemProps) => {
  const { menuState, showContextMenu, hideContextMenu } = useContextMenu();
  const { chatId } = useParams();

  const handleContextMenu = (
    e: MouseEvent,
    memberId: string,
    groupChatFlag: boolean,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu({ x: e.clientX, y: e.clientY }, options, (option) => {
      console.log(
        `Selected option: ${option.name} for member: ${memberId} and groupChat is ${groupChatFlag}`,
      );
    });
  };

  const renderLastMessagePreview = () => {
    if (!lastMessage) return 'No messages yet';
    const senderName = getFirstName(lastMessage.sender?.name ?? '');

    let senderPrefix = '';
    if (groupChat && lastMessage.sender) {
      senderPrefix =
        lastMessage.sender._id === currentUserId
          ? 'You: '
          : `${senderName}: `;
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
      <Link
        to={`/chat/${id}`}
        onContextMenu={(e) => handleContextMenu(e, id, groupChat)}
      >
        <div
          className={`flex cursor-pointer items-center gap-2 rounded-lg p-4 gradient-border hover:bg-gradient-background ${
            chatId === id ? 'bg-gradient-background' : ''
          }`}
        >
          <AvatarCard avatars={avatar} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="flex-1 truncate font-medium">{name}</p>
              <p className="ml-2 whitespace-nowrap text-xs text-body-300">
                {formatTime(lastMessage?.createdAt)}
              </p>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <p className="flex-1 truncate text-sm text-body-700">
                {renderLastMessagePreview()}
              </p>
              {messageAlert && messageAlert.count > 0 ? (
                <div className="ml-2 flex h-5 w-5 items-center justify-center rounded-full border border-red-light bg-red-dark text-xs font-normal text-red">
                  {messageAlert.count > 99 ? '99+' : messageAlert.count}
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
