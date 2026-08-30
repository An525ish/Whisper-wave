export type SignUploadFileInput = {
  name: string;
  mimeType: string;
  size: number;
};

export type SignUploadInput = {
  userId: string;
  chatId: string;
  files: SignUploadFileInput[];
};

export type SignedUploadParams = {
  /** Pre-assigned public_id scoped to ww/chats/{chatId}/{userId}/{uuid} */
  publicId: string;
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
};

export type SignUploadResult = {
  uploads: SignedUploadParams[];
};

export type CommitAttachment = {
  publicId: string;
  originalName: string;
  mimeType: string;
};
