import { z } from 'zod';
import { normalizeVibeTag } from '../types/match.js';

const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;

export const joinQueueSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(24, 'Display name must be 24 characters or fewer'),
  vibeTags: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(20)
        .regex(/^[\w\s-]+$/, 'Tag contains invalid characters'),
    )
    .max(3, 'Select up to 3 vibe tags')
    // Canonicalise here so the matcher can compare tags for real: "deep talks",
    // "Deep_Talks" and "deep  talks" must all collapse to one value or vibe
    // overlap scoring silently never matches.
    .transform((tags) => [...new Set(tags.map(normalizeVibeTag).filter(Boolean))])
    .default([]),
  gender: z.enum(GENDERS).default('prefer_not_to_say'),
  // Anonymous chat is 18+. This is a real gate, not a checkbox decoration —
  // the report model has an `underage` reason precisely because people lie.
  ageConfirmed: z.literal(true, {
    error: 'You must confirm you are 18 or older to enter',
  }),
});

const reportReason = z.enum([
  'inappropriate_content',
  'harassment',
  'spam',
  'underage',
  'other',
]);

/**
 * Report submission.
 *
 * A discriminated union so each target type carries exactly the ids it needs —
 * the service would otherwise have to re-validate what the schema should have
 * enforced. Note there is deliberately NO `targetAnonId`: an anon target is
 * always resolved server-side from the reporter's own session, so a client
 * cannot name (or frame) another person.
 */
export const submitReportSchema = z.discriminatedUnion('targetType', [
  z.object({
    targetType: z.literal('anonSession'),
    sessionId: z.string().min(1, 'sessionId is required'),
    reason: reportReason,
    details: z.string().max(500).optional(),
  }),
  z.object({
    targetType: z.literal('user'),
    targetUserId: z.string().min(1, 'targetUserId is required'),
    chatId: z.string().min(1, 'chatId is required to prove membership'),
    reason: reportReason,
    details: z.string().max(500).optional(),
  }),
]);

export const completeConnectionSchema = z.object({
  connectToken: z.string().min(1, 'connectToken is required'),
});

export type JoinQueueBody = z.infer<typeof joinQueueSchema>;
export type SubmitReportBody = z.infer<typeof submitReportSchema>;
export type CompleteConnectionBody = z.infer<typeof completeConnectionSchema>;
