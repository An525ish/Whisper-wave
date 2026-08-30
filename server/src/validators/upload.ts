import { z } from 'zod';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'text/plain',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_FILES = 5;

export const signUploadSchema = z.object({
  chatId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid chat id'),
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        mimeType: z.enum(ALLOWED_MIME_TYPES),
        size: z
          .number()
          .int()
          .positive()
          .max(MAX_FILE_SIZE_BYTES, 'File exceeds 50 MB limit'),
      }),
    )
    .min(1)
    .max(MAX_FILES, `Cannot sign more than ${MAX_FILES} files at once`),
});

export type SignUploadBody = z.infer<typeof signUploadSchema>;
