import { useState } from 'react';
import { useSocket } from '@/socket/SocketProvider';
import ChatInput from '@/components/chat/conversation/composer/ChatInput';
import * as chatApi from '@/api/chat';
import type { GifItem } from '@/api/gif';
import toast from 'react-hot-toast';

type ImageViewerReplyBarProps = {
  chatId: string;
  replyToMessageId: string;
};

const ImageViewerReplyBar = ({ chatId, replyToMessageId }: ImageViewerReplyBarProps) => {
  const socket = useSocket();
  const [message, setMessage] = useState('');
  // Attachments kept for ChatInput API compat — file upload not supported in viewer
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSubmit = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    socket.emit('NEW_MESSAGE', { message: trimmed, chatId, replyToMessageId });
    setMessage('');
  };

  const handleGifSelect = async (gif: GifItem) => {
    try {
      await chatApi.sendGif({
        chatId,
        gifId: gif.id,
        gifUrl: gif.url,
        gifTitle: gif.title,
        mimeType: gif.mimeType as 'image/gif' | 'image/png' | 'image/webp' | 'image/jpeg' | undefined,
        replyToMessageId,
      });
    } catch {
      toast.error('Failed to send GIF');
    }
  };

  return (
    <div className="w-full">
      <ChatInput
        message={message}
        setMessage={setMessage}
        attachments={attachments}
        setAttachments={setAttachments}
        handleSubmit={handleSubmit}
        onGifSelect={handleGifSelect}
        showAttachment={false}
        compact
        floating
        placeholder="Reply…"
        className="text-white placeholder:text-white/45"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
    </div>
  );
};

export default ImageViewerReplyBar;
