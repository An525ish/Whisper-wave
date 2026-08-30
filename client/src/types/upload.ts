/** One presigned upload ticket returned by POST /api/upload/sign. */
export type PresignedUploadParams = {
  presignedUrl: string;
  key: string;
  mimeType: string;
};

/** Per-file upload progress tracked in the hook. */
export type UploadFileProgress = {
  file: File;
  progress: number; // 0–100
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
};

/** Shape sent to POST /api/message/send-attachments after all files are in R2. */
export type CommitAttachment = {
  key: string;
  originalName: string;
  mimeType: string;
};
