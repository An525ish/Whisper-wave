import ChevronLeft from '@/shared/components/ui/icons/ChevronLeft';
import AvatarCard from '@/shared/components/ui/AvatarCard';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useChatDetailsQuery } from '../../../hooks';
import { useConversationHeaderActions } from '../../../hooks/useConversationHeaderActions';
import { useAuthStore } from '@/features/auth';
import { usePresenceStore } from '../../../stores/presence';
import { formatLastSeen, normalizeMemberIds } from '@/shared/utils/helpers';
import SelectModeActions from './SelectActions';
import DefaultActions from './HeaderActions';
import HeaderDialogs from './HeaderDialogs';
import { ConnectionOriginStrip } from '@/features/whisper';
import type { ConversationPanelHandle } from '../../../types/chat';
import type { ChatDetailsResponse } from '../../../types/chat';
import { ROUTES } from '@/shared/constants/routes';
import { CONVERSATION_HEADER_INNER_CLASS, CONVERSATION_HEADER_SHELL_CLASS } from '../../../constants/chat';
import ConversationHeaderSkeleton from './ConversationHeaderSkeleton';

type Props = {
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
}: Props) => {
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

      <header className={CONVERSATION_HEADER_SHELL_CLASS}>
        <div className={CONVERSATION_HEADER_INNER_CLASS}>
          <div className="relative flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-0.5 md:gap-1.5">
              {selectMode ? (
                <button
                  type="button"
                  onClick={onCancelSelect}
                  className="inline-flex h-11 shrink-0 items-center rounded-lg px-1 text-body transition active:bg-primary/40 active:text-white md:hidden"
                  aria-label="Cancel selection"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : (
                <Link
                  to={ROUTES.chats}
                  replace
                  className="inline-flex h-11 shrink-0 items-center rounded-lg px-1 text-body transition active:bg-primary/40 active:text-white md:hidden"
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

      {/* "How we met" — renders nothing unless this DM came from a Whisper match. */}
      <ConnectionOriginStrip chatId={groupChat ? undefined : chatId} />
    </>
  );
};

export default ConversationHeader;
