import { z } from 'zod';

/** RUNBOOK: a report is only resolved with a note saying what was done. */
export const REPORT_NOTE_MAX = 500;

export const reportReviewSchema = z.object({
  actionNote: z
    .string()
    .trim()
    .min(1, 'Say what was done before marking reviewed')
    .max(REPORT_NOTE_MAX, `Keep it under ${REPORT_NOTE_MAX} characters`),
});
