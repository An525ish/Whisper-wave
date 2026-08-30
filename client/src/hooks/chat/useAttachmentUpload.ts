import { useCallback, useState } from 'react';
import { directUploadToCloudinary, signUpload } from '@/api/upload';
import * as chatApi from '@/api/chat';
import type { UploadFileProgress } from '@/types/upload';

export type AttachmentUploadState = {
  isUploading: boolean;
  fileProgress: UploadFileProgress[];
};

export type SendAttachmentsParams = {
  chatId: string;
  files: File[];
  content?: string;
  replyToMessageId?: string;
};

/**
 * Three-step direct upload flow:
 *   1. POST /api/upload/sign        — server validates membership, returns signed params per file
 *   2. POST Cloudinary              — each file uploaded directly (parallel, with per-file progress)
 *   3. POST /api/message/send-attachments — server verifies publicIds, creates message in DB
 *
 * The API secret never leaves the server. The client only holds a short-lived (10 min) signature.
 */
export function useAttachmentUpload() {
  const [state, setState] = useState<AttachmentUploadState>({
    isUploading: false,
    fileProgress: [],
  });

  const reset = useCallback(() => {
    setState({ isUploading: false, fileProgress: [] });
  }, []);

  const upload = useCallback(
    async ({ chatId, files, content, replyToMessageId }: SendAttachmentsParams) => {
      // Initialise per-file progress trackers
      setState({
        isUploading: true,
        fileProgress: files.map((file) => ({ file, progress: 0, status: 'pending' })),
      });

      // Step 1 — sign
      const signRes = await signUpload(
        chatId,
        files.map((f) => ({ name: f.name, mimeType: f.type, size: f.size })),
      );
      const { uploads } = signRes.data;

      // Step 2 — upload each file directly to Cloudinary (parallel)
      const cloudinaryResults = await Promise.all(
        files.map((file, i) => {
          setState((prev) => {
            const next = [...prev.fileProgress];
            next[i] = { ...next[i], status: 'uploading' };
            return { ...prev, fileProgress: next };
          });

          return directUploadToCloudinary(file, uploads[i], (pct) => {
            setState((prev) => {
              const next = [...prev.fileProgress];
              next[i] = { ...next[i], progress: pct };
              return { ...prev, fileProgress: next };
            });
          })
            .then((res) => {
              setState((prev) => {
                const next = [...prev.fileProgress];
                next[i] = { ...next[i], progress: 100, status: 'done' };
                return { ...prev, fileProgress: next };
              });
              return res;
            })
            .catch((err: Error) => {
              setState((prev) => {
                const next = [...prev.fileProgress];
                next[i] = { ...next[i], status: 'error', error: err.message };
                return { ...prev, fileProgress: next };
              });
              throw err;
            });
        }),
      );

      // Step 3 — commit: server verifies each publicId on Cloudinary before writing to DB
      const result = await chatApi.commitAttachments({
        chatId,
        content,
        replyToMessageId,
        attachments: files.map((f, i) => ({
          publicId: cloudinaryResults[i].public_id,
          originalName: f.name,
          mimeType: f.type,
        })),
      });

      setState({ isUploading: false, fileProgress: [] });
      return result;
    },
    [],
  );

  return { upload, reset, ...state };
}
