import { useState } from 'react';
import type { LeaveConfirmKind } from '../types';

/**
 * Confirm state machine for the destructive whisper exits (leave / skip).
 *
 * Browser Back no longer needs a guard: a live whisper survives navigation
 * (the session lives in `WhisperSessionProvider`, and the pill brings the
 * user back), so leaving the route destroys nothing. Only the explicit Leave
 * and Skip buttons ask — both share this one confirm.
 */
export function useLeaveConfirm() {
  const [asked, setAsked] = useState<LeaveConfirmKind | null>(null);

  return {
    pending: asked,
    ask: setAsked,
    clear: () => setAsked(null),
  };
}
