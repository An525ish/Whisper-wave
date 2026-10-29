import { api } from '@/shared/lib/api/client';
import type { FeedbackKind } from '../constants';

export type FeedbackPayload = {
  kind: FeedbackKind;
  message: string;
  title?: string;
  area?: string;
  type?: string;
  rating?: number;
  expected?: string;
  reply?: string;
  /** Honeypot: stays empty for humans. */
  website?: string;
};

/** Emails the maker (guests allowed). Nothing is stored. */
export const sendFeedback = (body: FeedbackPayload) => api.post('/feedback', body);
