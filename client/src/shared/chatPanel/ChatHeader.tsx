import CopyIcon from '@/components/icons/Copy';
import CloseIcon from '@/components/icons/Close';
import ForwardIcon from '@/components/icons/Forward';
import LeaveGroupIcon from '@/components/icons/LeaveGroup';
import PhoneCallIcon from '@/components/icons/PhoneCall';
import ThreeDotsIcon from '@/components/icons/ThreeDots';
import VideoCallIcon from '@/components/icons/VideoCall';
import ChevronLeft from '@/components/icons/ChevronLeft';
import MembersIcon from '@/components/icons/Members';
import SelectMessagesIcon from '@/components/icons/SelectMessages';
import TrashIcon from '@/components/icons/Trash';
import AvatarCard from '@/components/ui/AvatarCard';
import ConfirmationModal from '@/components/ui/modal/confirmation-modal/ConfirmationModal';
import AccountBar from '@/shared/profilePanel/AccountBar';
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
  onOpenProfile?: () => void;
  canOpenProfileSheet?: boolean;
  searchOpen?: boolean;
  selectMode?: boolean;
  selectedCount?: number;
  deletableSelectedCount?: number;
  isDeletingSelected?: boolean;
  onToggleSelectMode?: () => void;
  onCancelSelect?: () => void;
  onCopySelected?: () => void;
  onDeleteSelected?: () => void;
  onForwardSelected?: () => void;
  onClearChat?: () => void;
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
  myRole?: 'creator' | 'admin' | 'member' | null;
};

type ChatDetailsResponse = {
  data?: ChatDetailsData;
};

const headerShellClass =
  'absolute inset-x-2 top-[max(0.5rem,env(safe-area-inset-top))] z-30 w-auto md:left-2 md:right-2 md:top-0';

const headerInnerClass =
  'rounded-xl border border-white/10 bg-[rgba(33,26,42,0.48)] px-2 py-1.5 pl-1.5 pr-3 shadow-[0_10px_28px_rgba(0,0,0,0.24)] backdrop-blur-xl lg:pl-2.5 lg:pr-5';

const ChatHeader = ({
  chatId,
  onOpenMembers,
  onOpenSearch,
  onOpenProfile,
  canOpenProfileSheet = false,
  searchOpen = false,
  selectMode = false,
  selectedCount = 0,
  deletableSelectedCount = 0,
  isDeletingSelected = false,
  onToggleSelectMode,
  onCancelSelect,
  onCopySelected,
  onDeleteSelected,
  onForwardSelected,
  onClearChat,
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
    if (selectMode) setIsDotsMenu(false);
  }, [selectMode]);

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
  const { avatar, name, groupChat, myRole } = chatData;
  const canClearChat = !groupChat || myRole === 'creator';
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

  const canDeleteSelection =
    selectedCount > 0 &&
    deletableSelectedCount > 0 &&
    selectedCount === deletableSelectedCount;

  const statusLabel = selectMode
    ? `${selectedCount} selected`
    : isTyping
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
        <AvatarSkeleton className="h-14 rounded-xl border border-border px-3 py-1 md:h-16" />
      </div>
    );
  }

  return (
    <>
      {isConfirmLeave ? (
        <ConfirmationModal
          variant="default"
          title="Leave this group?"
          description="You will lose access to this conversation until someone adds you again."
          confirmLabel="Leave"
          cancelLabel="Stay"
          onClose={() => setIsConfirmLeave(false)}
          handleConfirmationModal={handleConfirmationModal}
        />
      ) : null}

      <header className={headerShellClass}>
        <div className={headerInnerClass}>
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1 md:gap-1.5">
              <Link
                to="/"
                replace
                className="inline-flex h-11 shrink-0 items-center gap-0.5 rounded-lg px-1 text-body transition active:bg-primary/40 active:text-white md:hidden"
                aria-label="Back to chats"
              >
                <ChevronLeft className="h-6 w-6" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  // Avoid `disabled` here — global button styles set opacity: 0.55
                  // which muted the avatar + name on desktop.
                  if (selectMode || !canOpenProfileSheet || !onOpenProfile) {
                    return;
                  }
                  onOpenProfile();
                }}
                className={`flex min-w-0 flex-1 items-center gap-1 rounded-xl text-left transition md:gap-1.5 ${
                  !selectMode && canOpenProfileSheet && onOpenProfile
                    ? 'active:bg-primary/40 lg:active:bg-transparent'
                    : 'cursor-default hover:filter-none active:filter-none'
                }`}
                aria-label={
                  !selectMode && canOpenProfileSheet && onOpenProfile
                    ? 'View profile'
                    : undefined
                }
              >
                <div className="relative shrink-0">
                  <AvatarCard
                    avatars={avatarList}
                    avatarClassName="shadow-none"
                  />
                  {!groupChat && peerOnline ? (
                    <span
                      className="absolute bottom-0.5 right-1.5 h-3 w-3 rounded-full border-2 border-background bg-green md:bottom-1 md:right-2"
                      aria-hidden
                    />
                  ) : null}
                </div>
                <div className="min-w-0 pr-2">
                  <p className="truncate text-[15px] font-semibold leading-tight text-white md:text-base md:font-medium">
                    {name}
                  </p>
                  {statusLabel ? (
                    <p
                      className={`truncate text-xs md:text-sm ${
                        selectMode
                          ? 'text-white'
                          : isTyping || peerOnline
                            ? 'text-green'
                            : 'text-body-700'
                      }`}
                    >
                      {statusLabel}
                    </p>
                  ) : null}
                </div>
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-2 md:gap-3">
              {!selectMode ? (
                <div className="md:hidden">
                  <AccountBar
                    variant="notification"
                    overlayClassName="fixed inset-0 z-50"
                  />
                </div>
              ) : null}
              {selectMode ? (
                <>
                  <button
                    type="button"
                    disabled={selectedCount === 0}
                    onClick={onCopySelected}
                    className="grid h-11 w-11 place-items-center rounded-full border border-border text-body transition enabled:hover:border-green-light enabled:hover:text-green md:h-10 md:w-10"
                    aria-label="Copy selected messages"
                  >
                    <CopyIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={selectedCount === 0}
                    onClick={onForwardSelected}
                    className="grid h-11 w-11 place-items-center rounded-full border border-border text-body transition enabled:hover:border-green-light enabled:hover:text-green md:h-10 md:w-10"
                    aria-label="Forward selected messages"
                  >
                    <ForwardIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={!canDeleteSelection || isDeletingSelected}
                    onClick={onDeleteSelected}
                    className="grid h-11 w-11 place-items-center rounded-full border border-red/35 text-red transition enabled:hover:border-red/60 enabled:hover:bg-red/15 disabled:opacity-40 md:h-10 md:w-10"
                    aria-label="Delete selected messages"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onCancelSelect}
                    className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-body transition hover:border-green-light hover:text-white md:h-10 md:w-10"
                    aria-label="Cancel selection"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
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
                    className={`grid h-11 w-11 place-items-center rounded-full border text-body transition md:h-10 md:w-10 ${
                      searchOpen || isDotsMenu
                        ? 'border-green/50 bg-green/10 text-green'
                        : 'border-white/15 group hover:border-green-light hover:text-white'
                    }`}
                    aria-label="Chat options"
                    aria-expanded={isDotsMenu}
                  >
                    <ThreeDotsIcon className="h-4 w-4 fill-current stroke-current transition group-hover:fill-green group-hover:stroke-green" />
                  </button>
                </>
              )}
            </div>

            {!selectMode && isDotsMenu ? (
              <div
                ref={menuRef}
                className="absolute right-0 top-12 z-40 min-w-44 overflow-hidden rounded-xl border border-white/10 bg-[rgba(28,22,38,0.96)] p-1 shadow-2xl backdrop-blur-xl md:right-2 md:top-14"
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-body transition hover:bg-white/8 hover:text-green"
                  onClick={handleOpenSearch}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-green/15">
                    <img src={searchIcon} alt="" className="h-3.5 w-3.5" />
                  </span>
                  <span className="font-medium">Search chat</span>
                </button>

                <div className="my-0.5 h-px bg-white/8" />
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-body-700 transition hover:bg-white/8 hover:text-green"
                  onClick={() => {
                    setIsDotsMenu(false);
                    onToggleSelectMode?.();
                  }}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/5 text-body-700">
                    <SelectMessagesIcon className="h-3.5 w-3.5" />
                  </span>
                  Select messages
                </button>
                {canClearChat ? (
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-body-700 transition hover:bg-white/8 hover:text-red"
                    onClick={() => {
                      setIsDotsMenu(false);
                      onClearChat?.();
                    }}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/5">
                      <img src="/icons/clear.svg" alt="" className="h-3.5 w-3.5" />
                    </span>
                    Clear chat
                  </button>
                ) : null}

                {groupChat ? (
                  <>
                    <div className="my-0.5 h-px bg-white/8" />
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-body-700 transition hover:bg-white/8 hover:text-green"
                      onClick={addMemberHandler}
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/5">
                        <MembersIcon className="h-3.5 w-3.5" />
                      </span>
                      Members
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-body-700 transition hover:bg-white/8 hover:text-green"
                      onClick={handleisConfirmLeave}
                      disabled={isLeaveGroupLoading}
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/5">
                        <LeaveGroupIcon className="h-3 w-3" />
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
