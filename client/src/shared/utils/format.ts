import { MIN_PUBLIC_HEADCOUNT } from '@/shared/constants/app';

/** Format unread counts for badges and titles (list, header, tab title, etc.). */
export const formatUnreadCount = (count: number): string =>
  count > 99 ? '99+' : String(count);

/**
 * Live headcounts are shown only once they are big enough to be honest and
 * not identifying ("1 person inside" reads as surveillance and as a dead room).
 * Below the threshold callers show a calm "quiet" state instead of a number.
 */
export const publicHeadcount = (count: number): number | null =>
  count >= MIN_PUBLIC_HEADCOUNT ? count : null;
