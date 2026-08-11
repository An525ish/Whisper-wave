import LeaveGroupIcon from '@/components/icons/LeaveGroup';
import PhoneCallIcon from '@/components/icons/PhoneCall';
import ThreeDotsIcon from '@/components/icons/ThreeDots';
import VideoCallIcon from '@/components/icons/VideoCall';
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
      <div className="absolute -top-2 left-1/2 z-30 w-[90%] -translate-x-1/2 shadow-2xl">
        <AvatarSkeleton className={'h-16 border border-border px-4 py-1'} />
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

      <div className="absolute -top-2 left-1/2 z-30 w-[90%] -translate-x-1/2 shadow-2xl">
        <div className="rounded-xl border border-border bg-[rgba(33,26,42,0.75)] px-6 py-2 backdrop-blur-lg backdrop-saturate-[110%]">
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AvatarCard avatars={avatarList} />
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-sm text-body-700">
                  {isTyping ? 'Typing...' : 'Online'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                disabled
                className="grid h-10 w-10 place-items-center rounded-full border border-border group hover:border-green-light"
              >
                <PhoneCallIcon className="h-5 w-5 transition group-hover:fill-green" />
              </button>
              <button
                disabled
                className="grid h-10 w-10 place-items-center rounded-full border border-border group hover:border-green-light"
              >
                <VideoCallIcon className="h-5 w-5 transition group-hover:fill-green" />
              </button>
              <button
                ref={buttonRef}
                onClick={handleToggle}
                className="grid h-10 w-10 place-items-center rounded-full border border-border group hover:border-green-light"
              >
                <ThreeDotsIcon className="h-4 w-4 transition group-hover:fill-green" />
              </button>
            </div>

            {isDotsMenu ? (
              <div
                ref={menuRef}
                className="absolute right-9 top-16 flex flex-col items-start gap-2 rounded-lg border border-border bg-background-alt p-4"
              >
                {groupChat ? (
                  <>
                    <button
                      type="button"
                      className="group text-body-300 transition hover:text-green"
                      onClick={addMemberHandler}
                    >
                      <MembersIcon className="mr-1 inline-block h-5 w-5 transition group-hover:fill-green" />{' '}
                      Members
                    </button>
                    <button
                      type="button"
                      className="group text-body-300 transition hover:text-green"
                      onClick={handleisConfirmLeave}
                      disabled={isLeaveGroupLoading}
                    >
                      <LeaveGroupIcon className="mr-2 inline-block h-4 w-4 transition group-hover:fill-green" />{' '}
                      Leave Group
                    </button>
                  </>
                ) : (
                  <>No Options</>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatHeader;
