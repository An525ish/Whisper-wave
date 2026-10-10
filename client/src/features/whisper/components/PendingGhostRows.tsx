import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import useSocketEvent from '@/shared/hooks/useSocketEvent';
import useErrors from '@/shared/hooks/useError';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import { useSocket } from '@/shared/lib/socket/SocketProvider';
import { SOCKET_EVENTS } from '@/shared/constants/socket';
import BottomSheet from '@/shared/components/ui/BottomSheet';
import WaveIcon from '@/shared/components/ui/icons/Wave';
import { expiryLabel } from '../utils/expiryLabel';
import { queryKeys } from '../hooks/queryKeys';
import {
  useCancelPendingMutation,
  usePendingConnectionsQuery,
  useRedeemClaimMutation,
} from '../hooks/usePendingConnections';
import type { PendingConnectionItem } from '../types';

const expiryLeft = (expiresAt: string): string => {
  const left = Date.parse(expiresAt) - Date.now();
  return left <= 0 ? 'Expired' : `${expiryLabel(left)} left`;
};

/**
 * Ghost rows for whisper connections still in flight, rendered above the chat
 * list. A claim is mine to redeem (the tab-closing path); a row is waiting on
 * the partner. Tapping opens what is happening, when it expires, and Cancel —
 * when the partner completes, `REFETCH_CHATS` turns the ghost into a real chat.
 */
const PendingGhostRows = () => {
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { data: items } = usePendingConnectionsQuery();
  const [selected, setSelected] = useState<PendingConnectionItem | null>(null);

  const redeem = useRedeemClaimMutation();
  const [cancel] = useAsyncMutation(useCancelPendingMutation);

  useErrors([
    { isError: redeem.isError, error: redeem.error },
  ]);

  const events = useMemo(
    () => ({
      [SOCKET_EVENTS.REFETCH_CHATS]: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.pending });
      },
    }),
    [queryClient]
  );
  useSocketEvent(socket, events);

  if (!items || items.length === 0) return null;

  const closeSheet = () => setSelected(null);

  const handleRedeem = () => {
    if (!selected) return;
    redeem.mutate(selected.sessionId, {
      onSuccess: (res) => {
        if (res.data.status === 'connected') closeSheet();
      },
    });
  };

  const handleCancel = () => {
    if (!selected) return;
    void cancel('Cancelling…', selected.id).then((res) => {
      if (res) closeSheet();
    });
  };

  return (
    <>
      <ul aria-label="Pending whisper connections" className="shrink-0 px-3 pt-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setSelected(item)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-border/70 px-3 py-2.5 text-left opacity-80 transition hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
            >
              <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5">
                <WaveIcon className="h-5 w-5 text-body-300" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-body">
                  {item.origin.partnerAlias}
                </span>
                <span className="block truncate text-xs text-body-300">
                  {item.state === 'action_needed' ? 'Your move' : 'Waiting for them'}
                  {' · '}
                  {expiryLeft(item.expiresAt)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <BottomSheet
        open={selected !== null}
        onClose={closeSheet}
        labelledBy="pending-connection-title"
      >
        {selected && (
          <div className="px-5 pb-6 pt-2">
            <h2 id="pending-connection-title" className="text-lg font-semibold text-white">
              {selected.origin.partnerAlias}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-body-300">
              {selected.state === 'action_needed'
                ? 'You vibed with each other. Connect to open a real chat — this reveals your profile (name, photo) to them.'
                : 'You connected — now it is their turn. This row turns into a real chat when they connect.'}
            </p>
            {selected.origin.tags.length > 0 && (
              <p className="mt-2 text-xs text-body-300">
                Their vibe: {selected.origin.tags.join(' · ')}
              </p>
            )}
            <p className="mt-2 text-xs text-body-300">
              Expires in {expiryLeft(selected.expiresAt)}.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {selected.state === 'action_needed' && (
                <button
                  type="button"
                  onClick={handleRedeem}
                  disabled={redeem.isPending}
                  className="rounded-3xl bg-gradient-action-button-green px-5 py-2.5 text-sm font-medium text-body transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {redeem.isPending ? 'Connecting…' : 'Connect now'}
                </button>
              )}
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-3xl border border-border px-5 py-2.5 text-sm font-medium text-body-300 transition hover:text-body"
              >
                Cancel connection
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </>
  );
};

export default PendingGhostRows;
