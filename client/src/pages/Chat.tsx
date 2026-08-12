import AppWrapper from '@/layout/AppWrapper';
import ChatHeader from '@/shared/chatPanel/ChatHeader';
import ChatSearch from '@/shared/chatPanel/ChatSearch';
import ChatsViewPanel from '@/shared/chatPanel/ChatsViewPanel';
import AddMemberDialog from '@/shared/chatPanel/groupChatPanel/AddMemberDialog';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

const Chat = () => {
  const { chatId } = useParams();
  const [isMemberDialog, setIsMemberDialog] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [focusMessageId, setFocusMessageId] = useState<string | null>(null);
  const [highlightQuery, setHighlightQuery] = useState('');
  const focusClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (focusClearTimerRef.current) clearTimeout(focusClearTimerRef.current);
    };
  }, []);

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
    },
    [],
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
        <div className="relative z-30 shrink-0 md:pointer-events-none md:absolute md:inset-x-0 md:top-1 md:z-20">
          <div className="md:pointer-events-auto">
            <ChatHeader
              chatId={chatId}
              onOpenMembers={() => setIsMemberDialog(true)}
              onOpenSearch={() => setSearchOpen(true)}
              searchOpen={searchOpen}
            />
          </div>
        </div>

        <ChatsViewPanel
          chatId={chatId}
          focusMessageId={focusMessageId}
          highlightQuery={highlightQuery}
          searchOpen={searchOpen}
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
      </div>
    </AppWrapper>
  );
};

export default Chat;
