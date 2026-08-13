import ChevronLeft from '@/shared/components/icons/ChevronLeft';
import AvatarCard from '@/shared/components/ui/AvatarCard';
import ConfirmationModal from '@/shared/components/ui/modal/confirmation-modal/ConfirmationModal';
import AvatarSkeleton from '@/shared/components/skeletons/AvatarSkeleton';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useChatDetailsQuery, useLeaveGroupMutation } from '@/features/chat/hooks';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import { useAuthStore } from '@/features/auth/store';
import { usePresenceStore } from '@/features/chat/stores/presence';
import { formatLastSeen, normalizeMemberIds } from '@/shared/utils/helper';
import SelectModeActions from './header/SelectModeActions';
import DefaultActions from './header/DefaultActions';
import type { ChatsViewPanelHandle } from './ChatsViewPanel';

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
  panelRef?: RefObject<ChatsViewPanelHandle | null>;
};

type ChatMember = string | { _id?: string; lastSeen?: string };

type ChatDetailsData = {
  avatar?: string | string[];
  name?: string;
  groupChat?: boolean;
  members?: ChatMember[];
  myRole?: 'creator' | 'admin' | 'member' | null;
};

type ChatDetailsResponse = { data?: ChatDetailsData };

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
  panelRef,
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
  const peerOnline = !groupChat && peerId ? onlineUserIds.includes(peerId) : false;
  const peerLastSeen = !groupChat && peerId ? (lastSeenByUserId[peerId] ?? null) : null;

  const statusLabel = selectMode
    ? `${selectedCount} selected`
    : isTyping
      ? 'typing…'
      : groupChat
        ? null
        : peerOnline
          ? 'online'
          : formatLastSeen(peerLastSeen);

  const handleOpenSearch = () => {
    setIsDotsMenu(false);
    onOpenSearch?.();
  };

  const handleConfirmationModal = async ({ accept }: { accept: boolean }) => {
    if (accept) {
      await leaveGroup('Leaving Group', { chatId: chatId ?? '' });
    }
    setIsConfirmLeave(false);
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
                  if (selectMode || !canOpenProfileSheet || !onOpenProfile) return;
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
                  <AvatarCard avatars={avatarList} avatarClassName="shadow-none" />
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
              {selectMode ? (
                <SelectModeActions
                  selectedCount={selectedCount}
                  deletableSelectedCount={deletableSelectedCount}
                  isDeletingSelected={isDeletingSelected}
                  onCancelSelect={onCancelSelect}
                  onCopySelected={() => panelRef?.current?.copySelected()}
                  onDeleteSelected={() => panelRef?.current?.deleteSelected()}
                  onForwardSelected={() => panelRef?.current?.forwardSelected()}
                />
              ) : (
                <DefaultActions
                  isDotsMenu={isDotsMenu}
                  searchOpen={searchOpen}
                  buttonRef={buttonRef}
                  menuRef={menuRef}
                  groupChat={groupChat}
                  canClearChat={canClearChat}
                  isLeaveGroupLoading={isLeaveGroupLoading}
                  onToggle={() => setIsDotsMenu((prev) => !prev)}
                  onOpenSearch={handleOpenSearch}
                  onToggleSelectMode={() => {
                    setIsDotsMenu(false);
                    onToggleSelectMode?.();
                  }}
                  onClearChat={() => {
                    setIsDotsMenu(false);
                    panelRef?.current?.clearChat();
                  }}
                  onAddMember={() => {
                    setIsDotsMenu(false);
                    onOpenMembers?.();
                  }}
                  onLeaveGroup={() => {
                    setIsDotsMenu(false);
                    setIsConfirmLeave(true);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default ChatHeader;
