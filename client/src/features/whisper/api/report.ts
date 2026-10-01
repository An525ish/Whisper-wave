import { api } from '@/shared/lib/api/client';
import type { SubmitReportPayload } from '../types';

/**
 * Report the current anonymous partner. The server resolves the target from the
 * session (via the anonId cookie) and mutually blocks the pair, so we only need
 * to send the session + reason.
 */
export const submitReport = (payload: SubmitReportPayload) =>
  api.post<{ success: boolean; message: string }>('/report', {
    targetType: 'anonSession',
    sessionId: payload.sessionId,
    reason: payload.reason,
    details: payload.details,
  });
