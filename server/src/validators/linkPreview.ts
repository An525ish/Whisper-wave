import { z } from 'zod';

export const linkPreviewQuerySchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, 'url query param is required')
    .url({ message: 'Invalid URL' })
    .refine((value) => {
      try {
        return ['http:', 'https:'].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    }, 'Only http/https URLs are allowed'),
});

export type LinkPreviewQuery = z.infer<typeof linkPreviewQuerySchema>;
