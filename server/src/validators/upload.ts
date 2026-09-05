import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

/** Exhaustive list of MIME types accepted in chat attachments. */
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Video
  'video/mp4',
  'video/quicktime',
  'video/webm',
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/aac',
  'audio/webm',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;  // 20 MB — images, audio, documents
const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB — video

const uploadFileSchema = z.object({
  name: z.string().min(1).max(255),
  mimeType: z.enum(ALLOWED_MIME_TYPES as unknown as [AllowedMimeType, ...AllowedMimeType[]]),
  size: z.number().int().positive(),
}).superRefine((f, ctx) => {
  const limit = f.mimeType.startsWith('video/') ? MAX_VIDEO_SIZE_BYTES : MAX_FILE_SIZE_BYTES;
  if (f.size > limit) {
    ctx.addIssue({
      code: 'custom',
      message: `File exceeds ${f.mimeType.startsWith('video/') ? '100' : '20'} MB limit`,
    });
  }
});

export const signUploadSchema = z.object({
  chatId: objectId,
  files: z
    .array(uploadFileSchema)
    .min(1, 'At least one file required')
    .max(5, 'Maximum 5 files per request'),
});

export const commitAttachmentsSchema = z.object({
  chatId: objectId,
  content: z.string().max(2000).optional(),
  replyToMessageId: objectId.optional(),
  attachments: z
    .array(
      z.object({
        key: z
          .string()
          .min(1)
          .max(512)
          .regex(/^ww\/chats\/[a-f\d]{24}\/[a-f\d]{24}\/.+$/, 'Invalid attachment key'),
        originalName: z.string().min(1).max(255),
        mimeType: z.enum(ALLOWED_MIME_TYPES as unknown as [AllowedMimeType, ...AllowedMimeType[]]),
        isHd: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(5),
});

export type SignUploadBody = z.infer<typeof signUploadSchema>;
export type CommitAttachmentsBody = z.infer<typeof commitAttachmentsSchema>;
