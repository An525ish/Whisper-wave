import { useMutation } from '@tanstack/react-query';
import { joinQueue, leaveQueue } from '../api/match';
import { useAnonStore } from '../stores/anonStore';
import type { JoinQueuePayload } from '../types';

/**
 * Queue mutations.
 *
 * Store writes happen in `onSuccess`/`onSettled` so the component never holds a
 * parallel copy of `loading`/`error` — the page used to track the same error
 * three times (local state, store, socket callback), which is what forced an
 * ad-hoc precedence chain.
 */
export function useJoinQueueMutation() {
  return useMutation({
    mutationFn: (payload: JoinQueuePayload) => joinQueue(payload),
    onMutate: () => {
      const store = useAnonStore.getState();
      store.setSessionNotice(null);
      store.setError(null);
      store.setStatus('joining');
    },
    onSuccess: (res, payload) => {
      const store = useAnonStore.getState();
      store.setIdentity(
        res.data.anonId,
        payload.displayName,
        payload.vibeTags,
        payload.gender
      );
      // The server only ever returns `waiting` — pairing happens on the socket.
      store.setStatus('waiting');
    },
    onError: (err) => {
      const store = useAnonStore.getState();
      store.setStatus('idle');
      store.setError(
        err instanceof Error ? err.message : 'Could not reach the void'
      );
    },
  });
}

export function useLeaveQueueMutation() {
  return useMutation({
    mutationFn: () => leaveQueue(),
    // A failed leave is not worth surfacing: the server also drops us from the
    // queue when the socket disconnects, which happens either way.
    onSettled: () => useAnonStore.getState().reset(),
  });
}

