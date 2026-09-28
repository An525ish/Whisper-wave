import ChevronLeft from '@/shared/components/ui/icons/ChevronLeft';
import AvatarCard from '@/shared/components/ui/AvatarCard';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useChatDetailsQuery } from '@/features/chat/hooks';
import { useConversationHeaderActions } from '@/features/chat/hooks/useConversationHeaderActions';
import { useAuthStore } from '@/features/auth';
import { usePresenceStore } from '@/features/chat/stores/presence';
import { formatLastSeen, normalizeMemberIds } from '@/shared/utils/helpers';
import SelectModeActions from '@/features/chat/components/conversation/header/SelectActions';
import DefaultActions from '@/features/chat/components/conversation/header/HeaderActions';
import HeaderDialogs from '@/features/chat/components/conversation/header/HeaderDialogs';
import type { ConversationPanelHandle } from '@/features/chat/components/conversation/ConversationPanel';
import type { ChatDetailsResponse } from '@/features/chat/types/chat';

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
  panelRef?: RefObject<ConversationPanelHandle | null>;
};


const headerShellClass =
  'absolute inset-x-2 top-[max(0.5rem,env(safe-area-inset-top))] z-30 w-auto md:left-2 md:right-2 md:top-0';

const headerInnerClass =
  'rounded-xl border border-white/10 bg-[rgba(33,26,42,0.48)] px-2 py-1.5 pl-1.5 pr-3 shadow-[0_10px_28px_rgba(0,0,0,0.24)] backdrop-blur-xl lg:pl-2.5 lg:pr-5';

const bone = 'animate-pulse bg-white/18';

const ConversationHeaderSkeleton = () => (
  <div className={headerShellClass}>
    <div className={headerInnerClass}>
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1 md:gap-1.5">
          <div className="inline-flex h-11 w-8 shrink-0 md:hidden" aria-hidden />
          <div className="flex min-w-0 flex-1 items-center gap-1 md:gap-1.5">
            <div
              className={`mx-1 h-11 w-11 shrink-0 rounded-full border-2 border-white/10 ${bone} md:mx-2 md:h-12 md:w-12`}
            />
            <div className="min-w-0 pr-2">
              <div className={`h-4.75 w-28 rounded-md ${bone} md:h-5 md:w-36`} />
              <div className={`mt-1 h-3.5 w-16 rounded-md ${bone} md:h-4 md:w-24`} />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <div className={`h-10 w-10 rounded-full border border-white/15 ${bone}`} />
        </div>
      </div>
    </div>
  </div>
);

const ConversationHeader = ({
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
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const user = useAuthStore((s) => s.user);
  const setUserLastSeen = usePresenceStore((s) => s.setUserLastSeen);

  const { data: chatDetails, isLoading } = useChatDetailsQuery({
    id: chatId,
    populate: true,
  });

  const closeMenu = useCallback(() => setIsDotsMenu(false), []);

  const dotsMenuOpen = isDotsMenu && !selectMode;

  useEffect(() => {
    if (!isDotsMenu) return;
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
  }, [isDotsMenu]);

  const chatData = (chatDetails as ChatDetailsResponse | undefined)?.data || {};
  const { avatar, name, groupChat, myRole, members: rawMembers } = chatData;
  const canClearChat = true; // clear for me — available to everyone
  const avatarList = Array.isArray(avatar) ? avatar : avatar ? [avatar] : [];
  const userId = user?._id ? String(user._id) : '';

  const peerIds = useMemo(() => {
    const ids = normalizeMemberIds(chatData.members);
    return ids.filter((id) => id !== userId);
  }, [chatData.members, userId]);

  const peerId = peerIds[0];

  useEffect(() => {
    if (!chatData.members?.length) return;
    for (const member of chatData.members) {
      if (typeof member === 'string' || !member._id || !member.lastSeen) continue;
      setUserLastSeen(String(member._id), member.lastSeen);
    }
  }, [chatData.members, setUserLastSeen]);

  // Granular selectors — each subscribes only to its own slice so other chats
  // typing or other users coming online do not re-render this header.
  const isTyping = usePresenceStore((s) => Boolean(chatId && s.typingChatIds[chatId]));
  const peerOnline = usePresenceStore(
    (s) => !groupChat && !!peerId && s.onlineUserIds.includes(peerId),
  );
  const peerLastSeen = usePresenceStore(
    (s) => (!groupChat && peerId ? (s.lastSeenByUserId[peerId] ?? null) : null),
  );

  const memberCount = useMemo(
    () => normalizeMemberIds(chatData.members).length,
    [chatData.members],
  );

  const statusLabel = selectMode
    ? `${selectedCount} selected`
    : isTyping
      ? 'typing…'
      : groupChat
        ? memberCount > 0
          ? `${memberCount} member${memberCount === 1 ? '' : 's'}`
          : null
        : peerOnline
          ? 'online'
          : formatLastSeen(peerLastSeen);

  const handleOpenSearch = () => {
    setIsDotsMenu(false);
    onOpenSearch?.();
  };

  // Members excluding self (for CreatorLeaveDialog); ChatMember can be string | object
  const otherMembers = useMemo(() => {
    if (!Array.isArray(rawMembers)) return [];
    return rawMembers
      .filter(
        (m): m is { _id?: string; name?: string; avatar?: string; isAdmin?: boolean } =>
          typeof m === 'object' && m !== null && Boolean((m as { _id?: string })._id),
      )
      .filter((m) => m._id !== userId)
      .map((m) => ({ _id: m._id!, name: m.name ?? '', avatar: m.avatar, isAdmin: m.isAdmin }));
  }, [rawMembers, userId]);

  const headerActions = useConversationHeaderActions({
    chatId, groupChat, myRole, otherMembers, closeMenu,
  });

  if (isLoading) {
    return <ConversationHeaderSkeleton />;
  }

  return (
    <>
      <HeaderDialogs
        name={name}
        otherMembers={otherMembers}
        isLeaveGroupLoading={headerActions.isLeaveGroupLoading}
        isConfirmLeave={headerActions.isConfirmLeave}
        setIsConfirmLeave={headerActions.setIsConfirmLeave}
        onConfirmLeave={headerActions.handleConfirmationModal}
        isCreatorLeaveDialog={headerActions.isCreatorLeaveDialog}
        setIsCreatorLeaveDialog={headerActions.setIsCreatorLeaveDialog}
        onCreatorLeaveConfirm={headerActions.handleCreatorLeaveConfirm}
        isConfirmDeleteChat={headerActions.isConfirmDeleteChat}
        setIsConfirmDeleteChat={headerActions.setIsConfirmDeleteChat}
        onConfirmDeleteChat={headerActions.handleDeleteChatConfirm}
        isConfirmUnfriend={headerActions.isConfirmUnfriend}
        setIsConfirmUnfriend={headerActions.setIsConfirmUnfriend}
        onConfirmUnfriend={headerActions.handleUnfriendConfirm}
        isConfirmDeleteGroup={headerActions.isConfirmDeleteGroup}
        setIsConfirmDeleteGroup={headerActions.setIsConfirmDeleteGroup}
        onConfirmDeleteGroup={headerActions.handleDeleteGroupConfirm}
      />

      <header className={headerShellClass}>
        <div className={headerInnerClass}>
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-0.5 md:gap-1.5">
              {selectMode ? (
                <button
                  type="button"
                  onClick={onCancelSelect}
                  className="inline-flex h-9 shrink-0 items-center rounded-lg px-1 text-body transition active:bg-primary/40 active:text-white md:hidden"
                  aria-label="Cancel selection"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : (
                <Link
                  to="/"
                  replace
                  className="inline-flex h-9 shrink-0 items-center rounded-lg px-1 text-body transition active:bg-primary/40 active:text-white md:hidden"
                  aria-label="Back to chats"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Link>
              )}

              {selectMode ? (
                <p className="min-w-0 flex-1 truncate text-[17px] font-semibold tabular-nums text-white md:hidden">
                  {selectedCount}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  if (selectMode || !canOpenProfileSheet || !onOpenProfile) return;
                  onOpenProfile();
                }}
                className={`min-w-0 items-center gap-1 rounded-xl text-left transition md:gap-1.5 ${
                  selectMode ? 'hidden md:flex' : 'flex'
                } flex-1 ${
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
                <div className="relative shrink-0 overflow-visible">
                  <AvatarCard
                    avatars={avatarList}
                    avatarClassName="shadow-none"
                    showOnline={!groupChat && peerOnline}
                    showLoading
                  />
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

            <div className="flex shrink-0 items-center gap-1.5 md:gap-3">
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
                  isDotsMenu={dotsMenuOpen}
                  searchOpen={searchOpen}
                  buttonRef={buttonRef}
                  menuRef={menuRef}
                  groupChat={groupChat}
                  canClearChat={canClearChat}
                  isLeaveGroupLoading={headerActions.isLeaveGroupLoading}
                  isCreator={myRole === 'creator'}
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
                  onLeaveGroup={headerActions.handleLeaveGroup}
                  onDeleteGroup={() => {
                    setIsDotsMenu(false);
                    headerActions.setIsConfirmDeleteGroup(true);
                  }}
                  onDeleteChat={() => {
                    setIsDotsMenu(false);
                    headerActions.setIsConfirmDeleteChat(true);
                  }}
                  onUnfriend={() => {
                    setIsDotsMenu(false);
                    headerActions.setIsConfirmUnfriend(true);
                  }}
                  isDeleteGroupLoading={headerActions.isDeleteGroupLoading}
                  isDeleteChatLoading={headerActions.isDeleteChatLoading}
                  isUnfriendLoading={headerActions.isUnfriendLoading}
                />
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default ConversationHeader;
