import { useCallback, type ChangeEvent, type Dispatch, type KeyboardEvent, type SetStateAction } from 'react';
import toast from 'react-hot-toast';
import type { Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { SOCKET_EVENTS } from '@/shared/constants/socket';
import { useSendGifMutation } from '@/features/chat/hooks/useGifHooks';
import { queryKeys } from '@/features/chat/hooks/queryKeys';
import { useAttachmentUpload } from '@/features/chat/hooks/useAttachmentUpload';
import { buildReplySnapshot } from '@/features/chat/utils/chat';
import { isValidMessageId } from '@/shared/utils/helpers';
import type { Avatar, User } from '@/shared/types';
import type { ChatMessage } from '@/features/chat/types/chat';

export type GifSelection = {
  url: string;
  id: string;
  title: string;
  mimeType?: string;
  kind?: 'gif' | 'meme';
};

type UseConversationSendParams = {
  chatId?: string;
  user: User | null;
  socket: Socket;
  isImpersonated: boolean;
  actAsUser: boolean;
  message: string;
  setMessage: Dispatch<SetStateAction<string>>;
  attachments: File[];
  setAttachments: Dispatch<SetStateAction<File[]>>;
  imageQuality: 'standard' | 'hd';
  setImageQuality: Dispatch<SetStateAction<'standard' | 'hd'>>;
  editingMessageId: string | null;
  saveEdit: () => Promise<unknown>;
  replyingTo: ChatMessage | null;
  clearReply: () => void;
  isEditing: boolean;
  isTyping: boolean;
  clearTypingState: (notifyPeers: boolean) => void;
  isTypingRef: { current: boolean };
  timeoutRef: { current: ReturnType<typeof setTimeout> | null };
  setIsTyping: Dispatch<SetStateAction<boolean>>;
  emitStartTyping: () => void;
  emitStopTyping: () => void;
  setLiveMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  scrollToBottom: (instant?: boolean) => void;
};

/**
 * Owns the conversation composer's outbound flows — typing signalling, text +
 * attachment sends (with optimistic messages), Enter-to-send, and GIF/meme sends.
 * Composer state itself stays in the panel because message-actions (edit) also
 * consumes it; this hook only encapsulates the send handlers.
 */
export const useConversationSend = ({
  chatId, user, socket, isImpersonated, actAsUser,
  message, setMessage, attachments, setAttachments, imageQuality, setImageQuality,
  editingMessageId, saveEdit, replyingTo, clearReply,
  isEditing, isTyping, clearTypingState,
  isTypingRef, timeoutRef, setIsTyping, emitStartTyping, emitStopTyping,
  setLiveMessages, scrollToBottom,
}: UseConversationSendParams) => {
  const queryClient = useQueryClient();
  const attachmentUpload = useAttachmentUpload();
  const { mutate: sendGifMutation } = useSendGifMutation();

  const handleMessageChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setMessage(next);
    if (isEditing || !chatId) return;
    if (!next.trim()) { clearTypingState(true); return; }
    if (!isTypingRef.current) { setIsTyping(true); emitStartTyping(); }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => { setIsTyping(false); emitStopTyping(); timeoutRef.current = null; }, 1200);
  }, [isEditing, chatId, clearTypingState, isTypingRef, setIsTyping, emitStartTyping, timeoutRef, emitStopTyping, setMessage]);

  const handleSubmit = useCallback(async () => {
    if (editingMessageId) { await saveEdit(); return; }
    if (!message.trim() && (!attachments || attachments.length === 0)) return;
    // Ghost mode without "act as user" — block sends silently.
    if (isImpersonated && !actAsUser) { toast.error('Enable Act as user to send'); return; }
    if (isTyping) clearTypingState(true);

    if (!attachments || attachments.length === 0) {
      const trimmed = message.trim();
      if (!trimmed || !chatId) { if (!trimmed) return; toast.error('Unable to send message right now'); return; }
      const replySnapshot = replyingTo ? buildReplySnapshot(replyingTo) : undefined;
      const replyToMessageId = replyingTo && isValidMessageId(replyingTo._id) ? replyingTo._id : undefined;
      const pendingId = `pending-${Date.now()}`;
      setLiveMessages((prev) => [...prev, { _id: pendingId, content: trimmed, sender: { _id: user?._id ?? '', name: user?.name ?? '', avatar: user?.avatar as Avatar | undefined }, createdAt: new Date().toISOString(), replyTo: replySnapshot }]);
      setMessage(''); clearReply();
      socket.emit(SOCKET_EVENTS.NEW_MESSAGE, { message: trimmed, chatId, replyToMessageId });
      scrollToBottom(); return;
    }

    const replySnapshot = replyingTo ? buildReplySnapshot(replyingTo) : undefined;
    const replyToMessageId = replyingTo && isValidMessageId(replyingTo._id) ? replyingTo._id : undefined;
    const tempId = String(Date.now());
    const blobUrls: string[] = [];
    const tempAttachments = attachments.map((f) => {
      const tempUrl = URL.createObjectURL(f);
      blobUrls.push(tempUrl);
      return { tempUrl, name: f.name, type: f.type, size: f.size, uploading: true };
    });
    setLiveMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        content: message,
        sender: { _id: user?._id ?? '', name: user?.name ?? '', avatar: user?.avatar as Avatar | undefined },
        attachments: tempAttachments,
        createdAt: new Date().toISOString(),
        isUploading: true,
        replyTo: replySnapshot,
      },
    ]);
    const filesToUpload = [...attachments];
    setMessage(''); setAttachments([]); setImageQuality('standard'); clearReply();
    try {
      const result = await attachmentUpload.upload({
        chatId: chatId ?? '',
        files: filesToUpload,
        content: message,
        replyToMessageId,
        imageQuality,
      });
      blobUrls.forEach(URL.revokeObjectURL);
      if (!result) { setLiveMessages((prev) => prev.filter((m) => m._id !== tempId)); return; }
      const payload = ((result as { data?: ChatMessage }).data ?? result) as ChatMessage;
      setLiveMessages((prev) =>
        prev.map((m) =>
          m._id === tempId
            ? {
                ...payload,
                attachments: (payload.attachments ?? []).map((att, i) => ({
                  ...att,
                  tempUrl: tempAttachments[i]?.tempUrl,
                  uploading: false,
                })),
              }
            : m,
        ),
      );
      // Invalidate so the media tab and message history reflect the new attachment
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId ?? '') });
      void queryClient.invalidateQueries({ queryKey: queryKeys.media(chatId ?? '') });
      attachmentUpload.reset();
      scrollToBottom();
    } catch {
      blobUrls.forEach(URL.revokeObjectURL);
      toast.error('Failed to send attachments');
      setLiveMessages((prev) => prev.filter((m) => m._id !== tempId));
      attachmentUpload.reset();
    }
  }, [editingMessageId, saveEdit, message, attachments, isImpersonated, actAsUser, isTyping,
      clearTypingState, chatId, replyingTo, setLiveMessages, user, setMessage, clearReply,
      socket, scrollToBottom, setAttachments, setImageQuality, attachmentUpload, imageQuality, queryClient]);

  // handleEnterPress must come after handleSubmit to avoid TDZ reference
  const handleEnterPress = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingMessageId) { void saveEdit(); return; }
      void handleSubmit();
    }
  }, [editingMessageId, saveEdit, handleSubmit]);

  const handleGifSelect = useCallback(
    (gif: GifSelection) => {
      if (!chatId) return;
      const replyToMessageId =
        replyingTo && isValidMessageId(replyingTo._id) ? replyingTo._id : undefined;
      const replySnapGif = replyingTo ? buildReplySnapshot(replyingTo) : undefined;
      const tempId = `pending-gif-${Date.now()}`;
      const mime = gif.mimeType ?? 'image/gif';
      const label = gif.kind === 'meme' ? 'Meme' : 'GIF';
      setLiveMessages((prev) => [
        ...prev,
        {
          _id: tempId,
          sender: {
            _id: user?._id ?? '',
            name: user?.name ?? '',
            avatar: user?.avatar as Avatar | undefined,
          },
          attachments: [{ tempUrl: gif.url, name: gif.title || label, type: mime, uploading: true }],
          createdAt: new Date().toISOString(),
          isUploading: true,
          replyTo: replySnapGif,
        },
      ]);
      clearReply();
      scrollToBottom();
      sendGifMutation(
        {
          chatId,
          gifId: gif.id,
          gifUrl: gif.url,
          gifTitle: gif.title,
          mimeType: mime as 'image/gif' | 'image/png' | 'image/webp' | 'image/jpeg',
          kind: gif.kind ?? 'gif',
          replyToMessageId,
        },
        {
          onSuccess: (result) => {
            const payload = ((result as { data?: unknown })?.data ?? result) as ChatMessage;
            setLiveMessages((prev) =>
              prev.map((m) =>
                m._id === tempId
                  ? { ...payload, attachments: (payload.attachments ?? []).map((att) => ({ ...att, uploading: false })) }
                  : m
              )
            );
          },
          onError: () => {
            toast.error(`Failed to send ${label}`);
            setLiveMessages((prev) => prev.filter((m) => m._id !== tempId));
          },
        }
      );
    },
    [chatId, replyingTo, user, setLiveMessages, clearReply, scrollToBottom, sendGifMutation]
  );

  return { handleMessageChange, handleSubmit, handleEnterPress, handleGifSelect };
};
