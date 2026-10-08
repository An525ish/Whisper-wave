import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { submitReport } from '../api/report';
import { track } from '@/shared/lib/analytics';
import { WHISPER_EVENTS } from '../constants';
import type { SubmitReportPayload } from '../types';

/**
 * File an abuse report.
 *
 * Toasts live here (not in the sheet) so the leaf component stays presentational
 * and the success/failure copy has a single home.
 */
export function useReportMutation(options: { onSuccess: () => void }) {
  return useMutation({
    mutationFn: (input: SubmitReportPayload) => submitReport(input),
    onSuccess: (_data, variables) => {
      track(WHISPER_EVENTS.REPORT, { reason: variables.reason });
      toast.success('Report sent. You won’t be matched with them again.');
      options.onSuccess();
    },
    onError: () => {
      toast.error('Couldn’t send that report. Please try again.');
    },
  });
}
