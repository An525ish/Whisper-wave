import { useState } from 'react';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import { useReportActionMutation, useReviewReportMutation } from './useAdminReports';
import type { AdminBanScope } from '../types';

/** Row-level moderation actions; `busyId` is the report currently being acted on. */
export function useReportActions() {
  const [act] = useAsyncMutation(useReportActionMutation);
  const [review] = useAsyncMutation(useReviewReportMutation);
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async <T>(id: string, task: () => Promise<T>): Promise<T> => {
    setBusyId(id);
    try {
      return await task();
    } finally {
      setBusyId(null);
    }
  };

  const hideMessage = (id: string) =>
    run(id, () => act('Hiding message…', { id, action: 'hide' }));

  const banOffender = (id: string, scope: AdminBanScope, durationMin: number) =>
    run(id, () => act('Banning…', { id, action: 'ban', scope, durationMin }));

  /** Resolves true when the server accepted the review (so the form can close). */
  const markReviewed = (id: string, actionNote: string) =>
    run(id, async () => (await review('Marking reviewed…', { id, actionNote })) !== null);

  return { busyId, hideMessage, banOffender, markReviewed };
}
