import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { track } from '@/shared/lib/analytics';
import { MEME_EVENTS } from '../constants';
import { reportMeme } from '../api/memes';
import { useMemeStore } from '../stores/memeStore';
import type { MemeReportReason } from '../types';

/** Report a joke (guests allowed). On success it disappears from this device's feed. */
export function useReportMeme() {
  const hide = useMemeStore((s) => s.hide);
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: MemeReportReason }) =>
      reportMeme(id, reason).then((res) => res.data),
    onSuccess: (_result, { id, reason }) => {
      hide(id);
      track(MEME_EVENTS.REPORT, { reason });
      toast.success('Thanks — hidden, and flagged for review.');
    },
    onError: () => toast.error('Couldn’t send that report — try again.'),
  });
}
