import { useCallback, useRef, useState } from 'react';
import * as uploadApi from '@/api/upload';
import * as chatApi from '@/api/chat';
import type { UploadFileProgress, CommitAttachment } from '@/types/upload';

type UploadInput = {
  chatId: string;
  files: File[];
  content?: string;
  replyToMessageId?: string;
};

type UseAttachmentUploadReturn = {
  /** Kick off the 3-step sign → upload → commit flow. Returns the server response or null on failure. */
  upload: (input: UploadInput) => Promise<unknown>;
  reset: () => void;
  isUploading: boolean;
  /** Per-file progress state. Useful for rendering progress bars. */
  fileProgress: UploadFileProgress[];
};

/**
 * Orchestrates the full direct-upload lifecycle:
 *
 * 1. POST /api/upload/sign — server verifies membership, returns one presigned
 *    R2 PUT URL per file with content-type locked in.
 * 2. PUT (parallel XHR) — files upload directly to R2, bypassing the server.
 *    Per-file progress events drive the fileProgress state.
 * 3. POST /api/message/send-attachments — server HeadObjects every key to
 *    verify existence, age, size, and path ownership, then creates the message.
 *
 * The hook is stateful so the parent component can render upload progress
 * without managing any of the async coordination itself.
 */
export const useAttachmentUpload = (): UseAttachmentUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileProgress, setFileProgress] = useState<UploadFileProgress[]>([]);
  // Allows callers to check if an upload is in flight without stale-closure issues
  const uploadingRef = useRef(false);

  const reset = useCallback(() => {
    setFileProgress([]);
    setIsUploading(false);
    uploadingRef.current = false;
  }, []);

  const upload = useCallback(
    async ({ chatId, files, content, replyToMessageId }: UploadInput): Promise<unknown> => {
      if (uploadingRef.current) return null;
      if (files.length === 0) return null;

      uploadingRef.current = true;
      setIsUploading(true);

      // Initialise progress entries
      setFileProgress(
        files.map((file) => ({ file, progress: 0, status: 'pending' })),
      );

      try {
        // ── Step 1: get presigned URLs ────────────────────────────────────────
        const signResponse = await uploadApi.signUpload(
          chatId,
          files.map((f) => ({ name: f.name, mimeType: f.type, size: f.size })),
        );
        const { uploads } = signResponse.data;

        // Mark all as uploading
        setFileProgress((prev) =>
          prev.map((fp) => ({ ...fp, status: 'uploading' })),
        );

        // ── Step 2: parallel direct uploads to R2 ────────────────────────────
        await Promise.all(
          uploads.map((params, i) =>
            uploadApi
              .directUploadToR2(files[i]!, params, (percent) => {
                setFileProgress((prev) =>
                  prev.map((fp, idx) =>
                    idx === i ? { ...fp, progress: percent } : fp,
                  ),
                );
              })
              .then(() => {
                setFileProgress((prev) =>
                  prev.map((fp, idx) =>
                    idx === i ? { ...fp, status: 'done', progress: 100 } : fp,
                  ),
                );
              })
              .catch((err: Error) => {
                setFileProgress((prev) =>
                  prev.map((fp, idx) =>
                    idx === i
                      ? { ...fp, status: 'error', error: err.message }
                      : fp,
                  ),
                );
                throw err; // re-throw so Promise.all rejects
              }),
          ),
        );

        // ── Step 3: commit — server verifies and saves the message ────────────
        const attachments: CommitAttachment[] = uploads.map((p, i) => ({
          key: p.key,
          originalName: files[i]!.name,
          mimeType: p.mimeType,
        }));

        const result = await chatApi.commitAttachments({
          chatId,
          attachments,
          content,
          replyToMessageId,
        });

        return result;
      } catch (err) {
        // Mark any still-pending/uploading entries as error
        setFileProgress((prev) =>
          prev.map((fp) =>
            fp.status !== 'done' ? { ...fp, status: 'error' } : fp,
          ),
        );
        throw err;
      } finally {
        setIsUploading(false);
        uploadingRef.current = false;
      }
    },
    [],
  );

  return { upload, reset, isUploading, fileProgress };
};
