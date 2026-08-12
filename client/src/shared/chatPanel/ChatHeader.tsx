import LeaveGroupIcon from '@/components/icons/LeaveGroup';
import PhoneCallIcon from '@/components/icons/PhoneCall';
import ThreeDotsIcon from '@/components/icons/ThreeDots';
import VideoCallIcon from '@/components/icons/VideoCall';
import ChevronLeft from '@/components/icons/ChevronLeft';
import MembersIcon from '@/components/icons/Members';
import AvatarCard from '@/components/ui/AvatarCard';
import ConfirmationModal from '@/components/ui/modal/confirmation-modal/ConfirmationModal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useChatDetailsQuery, useLeaveGroupMutation } from '@/features/api/hooks';
import useAsyncMutation from '@/hooks/asyncMutation';
import AvatarSkeleton from '@/components/skeletons/AvatarSkeleton';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { usePresenceStore } from '@/stores/presence';
import { formatLastSeen, normalizeMemberIds } from '@/utils/helper';
import searchIcon from '@/assets/search.svg';

type ChatHeaderProps = {
  chatId?: string;
  onOpenMembers?: () => void;
  onOpenSearch?: () => void;
  searchOpen?: boolean;
};

type ChatMember =
  | string
  | {
      _id?: string;
      lastSeen?: string;
    };

type ChatDetailsData = {
  avatar?: string | string[];
  name?: string;
  groupChat?: boolean;
  members?: ChatMember[];
};

type ChatDetailsResponse = {
  data?: ChatDetailsData;
};

const headerShellClass =
  'relative z-30 w-full pt-[env(safe-area-inset-top)] md:absolute md:left-2 md:right-2 md:top-0 md:w-auto md:pt-0 md:shadow-2xl';

const headerInnerClass =
  'border-b border-border/70 bg-background/90 px-2 py-2.5 backdrop-blur-xl md:rounded-xl md:border md:border-border md:bg-[rgba(33,26,42,0.55)] md:py-1.5 md:pl-2 md:pr-4 md:backdrop-blur-md lg:pl-2.5 lg:pr-5';

const ChatHeader = ({
  chatId,
  onOpenMembers,
  onOpenSearch,
  searchOpen = false,
}: ChatHeaderProps) => {
  const [isDotsMenu, setIsDotsMenu] = useState(false);
  const [isConfirmLeave, setIsConfirmLeave] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const user = useAuthStore((s) => s.user);
  const typingChatIds = usePresenceStore((s) => s.typingChatIds);
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds);
  const lastSeenByUserId = usePresenceStore((s) => s.lastSeenByUserId);
  const setUserLastSeen = usePresenceStore((s) => s.setUserLastSeen);

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

  const chatData = (chatDetails as ChatDetailsResponse | undefined)?.data || {};
  const { avatar, name, groupChat } = chatData;
  const avatarList = Array.isArray(avatar) ? avatar : avatar ? [avatar] : [];

  const peerIds = useMemo(() => {
    const ids = normalizeMemberIds(chatData.members);
    const selfId = user?._id ? String(user._id) : '';
    return ids.filter((id) => id !== selfId);
  }, [chatData.members, user?._id]);

  const peerId = peerIds[0];

  useEffect(() => {
    if (!chatData.members?.length) return;
    for (const member of chatData.members) {
      if (typeof member === 'string' || !member._id || !member.lastSeen) continue;
      setUserLastSeen(String(member._id), member.lastSeen);
    }
  }, [chatData.members, setUserLastSeen]);

  const isTyping = Boolean(chatId && typingChatIds[chatId]);
  const peerOnline =
    !groupChat && peerId ? onlineUserIds.includes(peerId) : false;
  const peerLastSeen =
    !groupChat && peerId ? (lastSeenByUserId[peerId] ?? null) : null;

  const statusLabel = isTyping
    ? 'typing…'
    : groupChat
      ? null
      : peerOnline
        ? 'online'
        : formatLastSeen(peerLastSeen);

  const handleToggle = () => {
    setIsDotsMenu((prev) => !prev);
  };

  const handleOpenSearch = () => {
    setIsDotsMenu(false);
    onOpenSearch?.();
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
              <div className="relative">
                <AvatarCard avatars={avatarList} />
                {!groupChat && peerOnline ? (
                  <span
                    className="absolute bottom-0.5 right-1.5 h-3 w-3 rounded-full border-2 border-background bg-green md:bottom-1 md:right-2"
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className="min-w-0 pr-2">
                <p className="truncate text-[15px] font-semibold leading-tight md:text-base md:font-medium">
                  {name}
                </p>
                {statusLabel ? (
                  <p
                    className={`truncate text-xs md:text-sm ${
                      isTyping ? 'text-green' : 'text-body-700'
                    }`}
                  >
                    {statusLabel}
                  </p>
                ) : null}
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
                className={`grid h-11 w-11 place-items-center rounded-full border transition md:h-10 md:w-10 ${
                  searchOpen || isDotsMenu
                    ? 'border-green/50 bg-green/10'
                    : 'border-border/80 group hover:border-green-light'
                }`}
                aria-label="Chat options"
                aria-expanded={isDotsMenu}
              >
                <ThreeDotsIcon className="h-4 w-4 transition group-hover:fill-green" />
              </button>
            </div>

            {isDotsMenu ? (
              <div
                ref={menuRef}
                className="absolute right-0 top-12 z-40 min-w-52 overflow-hidden rounded-2xl border border-white/10 bg-[rgba(28,22,38,0.96)] p-1.5 shadow-2xl backdrop-blur-xl md:right-2 md:top-14"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-body transition hover:bg-white/8 hover:text-green"
                  onClick={handleOpenSearch}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-green/15">
                    <img src={searchIcon} alt="" className="h-4 w-4" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium">Search chat</span>
                    <span className="text-[11px] text-body-300">
                      Messages, media, links, dates
                    </span>
                  </span>
                </button>

                {groupChat ? (
                  <>
                    <div className="my-1 h-px bg-white/8" />
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-body-700 transition hover:bg-white/8 hover:text-green"
                      onClick={addMemberHandler}
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5">
                        <MembersIcon className="h-4 w-4" />
                      </span>
                      Members
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-body-700 transition hover:bg-white/8 hover:text-green"
                      onClick={handleisConfirmLeave}
                      disabled={isLeaveGroupLoading}
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5">
                        <LeaveGroupIcon className="h-3.5 w-3.5" />
                      </span>
                      Leave group
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
};

export default ChatHeader;
