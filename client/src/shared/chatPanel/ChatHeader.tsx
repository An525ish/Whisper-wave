import LeaveGroupIcon from '@/components/icons/LeaveGroup';
import PhoneCallIcon from '@/components/icons/PhoneCall';
import ThreeDotsIcon from '@/components/icons/ThreeDots';
import VideoCallIcon from '@/components/icons/VideoCall';
import ChevronLeft from '@/components/icons/ChevronLeft';
import AvatarCard from '@/components/ui/AvatarCard';
import ConfirmationModal from '@/components/ui/modal/confirmation-modal/ConfirmationModal';
import { useCallback, useEffect, useRef, useState } from 'react';
import MembersIcon from '@/components/icons/Members';
import { useChatDetailsQuery, useLeaveGroupMutation } from '@/features/api/hooks';
import { START_TYPING, STOP_TYPING } from '@/lib/socketConstants';
import useSocketEvent from '@/hooks/socketEvent';
import { useSocket } from '@/socket/SocketProvider';
import useAsyncMutation from '@/hooks/asyncMutation';
import AvatarSkeleton from '@/components/skeletons/AvatarSkeleton';
import { Link } from 'react-router-dom';

type ChatHeaderProps = {
  chatId?: string;
  onOpenMembers?: () => void;
};

type TypingPayload = {
  chatId: string;
};

type ChatDetailsData = {
  avatar?: string | string[];
  name?: string;
  groupChat?: boolean;
};

type ChatDetailsResponse = {
  data?: ChatDetailsData;
};

/** Phone: sticky into safe area. md+: longer glass pill over the padded thread. */
const headerShellClass =
  'relative z-30 w-full pt-[env(safe-area-inset-top)] md:absolute md:left-2 md:right-2 md:top-0 md:w-auto md:pt-0 md:shadow-2xl';

const headerInnerClass =
  'border-b border-border/70 bg-background/90 px-2 py-2.5 backdrop-blur-xl md:rounded-xl md:border md:border-border md:bg-[rgba(33,26,42,0.55)] md:py-1.5 md:pl-2 md:pr-4 md:backdrop-blur-md lg:pl-2.5 lg:pr-5';

const ChatHeader = ({ chatId, onOpenMembers }: ChatHeaderProps) => {
  const [isDotsMenu, setIsDotsMenu] = useState(false);
  const [isConfirmLeave, setIsConfirmLeave] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const { data: chatDetails, isLoading } = useChatDetailsQuery({
    id: chatId,
    populate: true,
  });

  const [leaveGroup, { isLoading: isLeaveGroupLoading }] = useAsyncMutation(
    useLeaveGroupMutation,
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDotsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const socket = useSocket();

  const startTypingListener = useCallback(
    (res: TypingPayload) => {
      if (res.chatId !== chatId) return;
      setIsTyping(true);
    },
    [chatId],
  );

  const stopTypingListener = useCallback(
    (res: TypingPayload) => {
      if (res.chatId !== chatId) return;
      setIsTyping(false);
    },
    [chatId],
  );

  const events = {
    [START_TYPING]: startTypingListener,
    [STOP_TYPING]: stopTypingListener,
  };

  useSocketEvent(socket, events as Parameters<typeof useSocketEvent>[1]);

  const chatData = (chatDetails as ChatDetailsResponse | undefined)?.data || {};
  const { avatar, name, groupChat } = chatData;
  const avatarList = Array.isArray(avatar) ? avatar : avatar ? [avatar] : [];

  const handleToggle = () => {
    setIsDotsMenu((prev) => !prev);
  };

  const handleisConfirmLeave = async () => {
    setIsDotsMenu(false);
    setIsConfirmLeave(true);
  };

  const handleConfirmationModal = async ({ accept }: { accept: boolean }) => {
    if (accept) {
      await leaveGroup('Leaving Group', { chatId: chatId ?? '' });
    }
    setIsConfirmLeave(false);
  };

  const addMemberHandler = () => {
    setIsDotsMenu(false);
    onOpenMembers?.();
  };

  if (isLoading) {
    return (
      <div className={headerShellClass}>
        <AvatarSkeleton className="h-14 border-b border-border px-3 py-1 md:h-16 md:rounded-xl md:border" />
      </div>
    );
  }

  return (
    <>
      {isConfirmLeave ? (
        <ConfirmationModal
          handleConfirmationModal={handleConfirmationModal}
          onClose={() => setIsConfirmLeave(false)}
        />
      ) : null}

      <header className={headerShellClass}>
        <div className={headerInnerClass}>
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1 md:gap-1.5">
              <Link
                to="/"
                replace
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border/70 bg-primary/50 text-body transition active:scale-95 active:bg-primary md:hidden"
                aria-label="Back to chats"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <AvatarCard avatars={avatarList} />
              <div className="min-w-0 pr-2">
                <p className="truncate text-[15px] font-semibold leading-tight md:text-base md:font-medium">
                  {name}
                </p>
                <p className="truncate text-xs text-body-700 md:text-sm">
                  {isTyping ? 'Typing...' : 'Online'}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 md:gap-3">
              <button
                type="button"
                disabled
                className="hidden h-10 w-10 place-items-center rounded-full border border-border group hover:border-green-light md:grid"
                aria-label="Voice call (coming soon)"
              >
                <PhoneCallIcon className="h-5 w-5 transition group-hover:fill-green" />
              </button>
              <button
                type="button"
                disabled
                className="hidden h-10 w-10 place-items-center rounded-full border border-border group hover:border-green-light lg:grid"
                aria-label="Video call (coming soon)"
              >
                <VideoCallIcon className="h-5 w-5 transition group-hover:fill-green" />
              </button>
              <button
                type="button"
                ref={buttonRef}
                onClick={handleToggle}
                className="grid h-11 w-11 place-items-center rounded-full border border-border/80 group hover:border-green-light md:h-10 md:w-10"
                aria-label="Chat options"
              >
                <ThreeDotsIcon className="h-4 w-4 transition group-hover:fill-green" />
              </button>
            </div>

            {isDotsMenu ? (
              <div
                ref={menuRef}
                className="absolute right-0 top-12 z-40 flex min-w-44 flex-col items-stretch gap-1 rounded-xl border border-border bg-background-alt p-2 shadow-xl md:right-2 md:top-14"
              >
                {groupChat ? (
                  <>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-body-300 transition hover:bg-primary hover:text-green"
                      onClick={addMemberHandler}
                    >
                      <MembersIcon className="h-5 w-5" />
                      Members
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-body-300 transition hover:bg-primary hover:text-green"
                      onClick={handleisConfirmLeave}
                      disabled={isLeaveGroupLoading}
                    >
                      <LeaveGroupIcon className="h-4 w-4" />
                      Leave Group
                    </button>
                  </>
                ) : (
                  <span className="px-3 py-2 text-sm text-body-300">
                    No options yet
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
};

export default ChatHeader;
