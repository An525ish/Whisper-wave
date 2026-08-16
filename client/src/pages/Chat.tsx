import AppWrapper from '@/layout/AppWrapper';
import ChatHeader from '@/components/chat/conversation/header/ConversationHeader';
import ChatSearch from '@/components/chat/conversation/search/MessageSearch';
import ChatsViewPanel, { type ConversationPanelHandle } from '@/components/chat/conversation/ConversationPanel';
import OlderMessagesLoader from '@/components/chat/conversation/OlderMessagesLoader';
import AddMemberDialog from '@/components/chat/dialogs/AddMemberDialog';
import ProfileSheet from '@/components/profile/ProfileSheet';
import { useMediaQuery } from '@/hooks/shared/useMediaQuery';
import { useMessageJump } from '@/hooks/chat';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

const Chat = () => {
  const { chatId } = useParams();
  const [isMemberDialog, setIsMemberDialog] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [deletableSelectedCount, setDeletableSelectedCount] = useState(0);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);
  const panelRef = useRef<ConversationPanelHandle>(null);
  const handleCancelSelect = useCallback(() => {
    setSelectMode(false);
    setSelectedCount(0);
    setDeletableSelectedCount(0);
  }, []);
  const [focusMessageId, setFocusMessageId] = useState<string | null>(null);
  const [highlightQuery, setHighlightQuery] = useState('');
  const canOpenProfileSheet = useMediaQuery('(max-width: 1023px)');
  const focusClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const { ensureMessageLoaded } = useMessageJump(chatId);

  useEffect(() => {
    return () => {
      if (focusClearTimerRef.current) clearTimeout(focusClearTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!canOpenProfileSheet) setProfileOpen(false);
  }, [canOpenProfileSheet]);

  useEffect(() => {
    setSelectMode(false);
    setSelectedCount(0);
    setDeletableSelectedCount(0);
    setIsEditingMessage(false);
    setIsFetchingOlder(false);
  }, [chatId]);

  const handleJumpToMessage = useCallback(
    (
      messageId: string,
      query: string,
      options?: { closeSearch?: boolean },
    ) => {
      if (focusClearTimerRef.current) {
        clearTimeout(focusClearTimerRef.current);
        focusClearTimerRef.current = null;
      }

      if (!messageId) {
        setFocusMessageId(null);
        setHighlightQuery('');
        return;
      }

      void (async () => {
        try {
          await ensureMessageLoaded(messageId);
        } catch {
          // Context fetch failed — useChatScroll's page-chase acts as fallback
        }
        setFocusMessageId(messageId);
        setHighlightQuery(query);
        if (options?.closeSearch) {
          setSearchOpen(false);
          focusClearTimerRef.current = setTimeout(() => {
            setFocusMessageId((prev) => (prev === messageId ? null : prev));
            setHighlightQuery('');
            focusClearTimerRef.current = null;
          }, 1800);
        }
      })();
    },
    [ensureMessageLoaded],
  );

  const handleSearchClose = useCallback(() => {
    if (focusClearTimerRef.current) {
      clearTimeout(focusClearTimerRef.current);
      focusClearTimerRef.current = null;
    }
    setSearchOpen(false);
    setFocusMessageId(null);
    setHighlightQuery('');
  }, []);

  return (
    <AppWrapper>
      <div className="relative flex h-full min-h-0 flex-col bg-background md:bg-transparent md:pt-1">
        {/* Soft top fade so scrolled messages dissolve under the floating header */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[calc(max(0.5rem,env(safe-area-inset-top))+5.25rem)] bg-linear-to-b from-[rgb(33,26,42)]/50 from-25% via-[rgb(33,26,42)]/22 to-transparent md:top-1 md:h-28 md:rounded-t-xl"
        />
        <OlderMessagesLoader visible={isFetchingOlder && !searchOpen} />
        <div className={`pointer-events-none absolute inset-x-0 top-0 z-30 md:top-1 ${
          isEditingMessage ? 'pointer-events-none opacity-40' : ''
        }`}>
          <div className={isEditingMessage ? 'pointer-events-none' : 'pointer-events-auto'}>
            <ChatHeader
              chatId={chatId}
              onOpenMembers={() => setIsMemberDialog(true)}
              onOpenSearch={() => setSearchOpen(true)}
              onOpenProfile={() => setProfileOpen(true)}
              canOpenProfileSheet={canOpenProfileSheet}
              searchOpen={searchOpen}
              selectMode={selectMode}
              selectedCount={selectedCount}
              deletableSelectedCount={deletableSelectedCount}
              isDeletingSelected={isDeletingSelected}
              onToggleSelectMode={() => setSelectMode((prev) => !prev)}
              onCancelSelect={handleCancelSelect}
              panelRef={panelRef}
            />
          </div>
        </div>

        <ChatsViewPanel
          ref={panelRef}
          chatId={chatId}
          focusMessageId={focusMessageId}
          highlightQuery={highlightQuery}
          searchOpen={searchOpen}
          selectMode={selectMode}
          onSelectModeChange={setSelectMode}
          onSelectedCountChange={setSelectedCount}
          onDeletableSelectedCountChange={setDeletableSelectedCount}
          onDeletingSelectedChange={setIsDeletingSelected}
          onEditingChange={setIsEditingMessage}
          onFetchingNextPageChange={setIsFetchingOlder}
        />

        {isMemberDialog ? (
          <div className="absolute inset-0 z-40 md:inset-x-0 md:bottom-0 md:top-20">
            <AddMemberDialog
              isMemberDialog={isMemberDialog}
              setIsMemberDialog={setIsMemberDialog}
            />
          </div>
        ) : null}

        <ChatSearch
          chatId={chatId}
          open={searchOpen}
          onClose={handleSearchClose}
          onJumpToMessage={handleJumpToMessage}
        />

        <ProfileSheet
          open={profileOpen && canOpenProfileSheet}
          onClose={() => setProfileOpen(false)}
        />
      </div>
    </AppWrapper>
  );
};

export default Chat;
