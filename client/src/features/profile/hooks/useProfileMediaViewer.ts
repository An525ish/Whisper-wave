import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useDeleteMessageMutation, useForwardMessagesMutation } from '@/features/chat';
import type { MediaFile } from '@/features/profile/components/shared-content/types';
import type { ViewerMediaFile } from '@/features/profile/types';

type UseProfileMediaViewerParams = {
  chatId: string | undefined;
  /** Image/video media (documents excluded) shown in the viewer, in order. */
  mediaFiles: MediaFile[];
};

/**
 * Owns the image-viewer surface for the profile panel: open/index state plus the
 * forward/delete flows for the message a viewed attachment belongs to.
 */
export const useProfileMediaViewer = ({ chatId, mediaFiles }: UseProfileMediaViewerParams) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialImageIndex, setInitialImageIndex] = useState(0);
  const [viewerForwardMsgId, setViewerForwardMsgId] = useState<string | null>(null);
  const [viewerDeleteMsgId, setViewerDeleteMsgId] = useState<string | null>(null);

  const deleteMutation = useDeleteMessageMutation();
  const forwardMutation = useForwardMessagesMutation();

  const viewerMediaFiles: ViewerMediaFile[] = useMemo(
    () => mediaFiles
      .filter((f): f is MediaFile & { url: string } => Boolean(f.url))
      .map((f) => ({ _id: f._id ?? f.publicId ?? f.url, url: f.url, name: f.name, publicId: f.publicId, fileType: f.fileType, messageId: f.messageId, senderId: f.senderId })),
    [mediaFiles],
  );

  const handleViewerForward = useCallback((messageId: string) => {
    setViewerOpen(false);
    setViewerForwardMsgId(messageId);
  }, []);

  const handleViewerDelete = useCallback((messageId: string) => {
    setViewerOpen(false);
    setViewerDeleteMsgId(messageId);
  }, []);

  const confirmViewerDelete = useCallback(async () => {
    if (!viewerDeleteMsgId || !chatId) return;
    try {
      await deleteMutation.mutateAsync({ messageId: viewerDeleteMsgId, chatId });
    } catch {
      toast.error('Failed to delete message');
    } finally {
      setViewerDeleteMsgId(null);
    }
  }, [viewerDeleteMsgId, chatId, deleteMutation]);

  const handleViewerForwardToChat = useCallback(async (targetChatIds: string[]) => {
    if (!chatId || !viewerForwardMsgId || targetChatIds.length === 0) return;
    try {
      await Promise.all(
        targetChatIds.map((targetChatId) =>
          forwardMutation.mutateAsync({ targetChatId, sourceChatId: chatId, messageIds: [viewerForwardMsgId] }),
        ),
      );
      setViewerForwardMsgId(null);
      toast.success('Forwarded');
    } catch {
      toast.error('Failed to forward');
    }
  }, [chatId, viewerForwardMsgId, forwardMutation]);

  const openImageViewerForFile = useCallback((file: MediaFile) => {
    const index = viewerMediaFiles.findIndex(
      (item) => item.url === file.url || (file._id && item._id === file._id) || (file.publicId && item._id === file.publicId),
    );
    if (index >= 0) { setInitialImageIndex(index); setViewerOpen(true); }
  }, [viewerMediaFiles]);

  return {
    viewerOpen, setViewerOpen,
    initialImageIndex,
    viewerMediaFiles,
    viewerForwardMsgId, setViewerForwardMsgId,
    viewerDeleteMsgId, setViewerDeleteMsgId,
    handleViewerForward, handleViewerDelete,
    confirmViewerDelete, handleViewerForwardToChat,
    openImageViewerForFile,
    forwardIsPending: forwardMutation.isPending,
  };
};
