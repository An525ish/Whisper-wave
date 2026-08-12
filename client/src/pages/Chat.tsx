import AppWrapper from '@/layout/AppWrapper';
import ChatHeader from '@/shared/chatPanel/ChatHeader';
import ChatsViewPanel from '@/shared/chatPanel/ChatsViewPanel';
import AddMemberDialog from '@/shared/chatPanel/groupChatPanel/AddMemberDialog';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

const Chat = () => {
  const { chatId } = useParams();
  const [isMemberDialog, setIsMemberDialog] = useState(false);

  return (
    <AppWrapper>
      <div className="relative flex h-full min-h-0 flex-col bg-background md:bg-transparent md:pt-1">
        {/* Floating bar overlays the thread; sits in the chat top padding */}
        <div className="relative z-30 shrink-0 md:pointer-events-none md:absolute md:inset-x-0 md:top-1 md:z-20">
          <div className="md:pointer-events-auto">
            <ChatHeader
              chatId={chatId}
              onOpenMembers={() => setIsMemberDialog(true)}
            />
          </div>
        </div>

        <ChatsViewPanel chatId={chatId} />

        {isMemberDialog ? (
          <div className="absolute inset-0 z-40 md:inset-x-0 md:bottom-0 md:top-20">
            <AddMemberDialog
              isMemberDialog={isMemberDialog}
              setIsMemberDialog={setIsMemberDialog}
            />
          </div>
        ) : null}
      </div>
    </AppWrapper>
  );
};

export default Chat;
