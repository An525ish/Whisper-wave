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
      <div className="relative flex h-full min-h-0 flex-col gap-3">
        <div className="relative z-10 shrink-0">
          <ChatHeader
            chatId={chatId}
            onOpenMembers={() => setIsMemberDialog(true)}
          />
        </div>
        <ChatsViewPanel chatId={chatId} />

        {isMemberDialog ? (
          <div className="absolute inset-x-0 bottom-0 top-[4.5rem] z-40">
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
