import { z } from 'zod';

const short = (max: number) => z.string().trim().max(max).optional();

/**
 * POST /api/feedback body. One shape for all three kinds; the client only sends
 * the fields a kind uses. `website` is a honeypot: humans never see or fill it.
 */
export const submitFeedbackSchema = z.object({
  kind: z.enum(['app', 'feedback', 'problem']),
  title: short(60),
  message: z.string().trim().min(5, 'Write at least a few words').max(1500),
  area: short(30),
  type: short(30),
  rating: z.number().int().min(1).max(5).optional(),
  expected: short(200),
  reply: short(120),
  website: short(200),
});

export type SubmitFeedbackBody = z.infer<typeof submitFeedbackSchema>;
