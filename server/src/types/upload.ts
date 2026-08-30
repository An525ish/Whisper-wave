/** Input describing a single file the client wants to upload. */
export type SignUploadFileInput = {
  name: string;
  mimeType: string;
  size: number;
};

/** Payload sent by the client to request presigned upload URLs. */
export type SignUploadInput = {
  userId: string;
  chatId: string;
  files: SignUploadFileInput[];
};

/** One presigned upload ticket returned to the client per file. */
export type PresignedUploadParams = {
  /** Full presigned S3 PUT URL — client uploads directly here. */
  presignedUrl: string;
  /** R2 object key stored in DB as publicId — also used to build the delivery URL. */
  key: string;
  /** MIME type locked into the presigned command — client must use this in Content-Type. */
  mimeType: string;
};

export type SignUploadResult = {
  uploads: PresignedUploadParams[];
};

/**
 * One attachment the client sends back after a successful direct upload.
 * The server will HeadObject the key to verify before saving the message.
 */
export type CommitAttachment = {
  key: string;
  originalName: string;
  mimeType: string;
};
