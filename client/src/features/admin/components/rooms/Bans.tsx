import { useState } from 'react';
import useAsyncMutation from '@/shared/hooks/useAsyncMutation';
import {
  useBanIdentityMutation,
  useLiftBanMutation,
  useRoomBansQuery,
} from '../../hooks';
import { OBJECT_ID, UUID } from '../../utils/rooms';

const timeLeft = (until: string): string => {
  const ms = Date.parse(until) - Date.now();
  if (ms <= 0) return 'expired';
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return `${Math.max(1, Math.floor(ms / 60_000))}m left`;
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
};

/**
 * Room bans: list, create (room-scoped or global), lift. Identity is dual-key
 * (`gid` and/or `userId`) — signing in or clearing cookies sheds neither while
 * the other is known.
 */
const Bans = () => {
  const { data: bans } = useRoomBansQuery();
  const [create, { isLoading: creating }] = useAsyncMutation(useBanIdentityMutation);
  const [lift] = useAsyncMutation(useLiftBanMutation);

  const [roomSlug, setRoomSlug] = useState('');
  const [identity, setIdentity] = useState('');
  const [minutes, setMinutes] = useState('60');
  const [reason, setReason] = useState('');
  const [liftingId, setLiftingId] = useState<string | null>(null);
  const [identityError, setIdentityError] = useState(false);

  const submit = async () => {
    const id = identity.trim();
    if (!id || !reason.trim()) return;
    const isUuid = UUID.test(id);
    if (!isUuid && !OBJECT_ID.test(id)) {
      setIdentityError(true);
      return;
    }
    setIdentityError(false);
    const banned = await create('Banning…', {
      roomSlug: roomSlug.trim() || null,
      ...(isUuid ? { gid: id } : { userId: id }),
      minutes: Math.min(525_600, Math.max(1, Number(minutes) || 60)),
      reason: reason.trim(),
    });
    if (banned !== null) {
      setIdentity('');
      setReason('');
    }
  };

  const liftBan = async (id: string) => {
    setLiftingId(id);
    try {
      await lift('Lifting ban…', id);
    } finally {
      setLiftingId(null);
    }
  };

  return (
    <section aria-label="Room bans" className="rounded-2xl border border-border/60 bg-white/[0.03] p-5">
      <h2 className="text-base font-semibold text-white">Bans</h2>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          value={roomSlug}
          onChange={(e) => setRoomSlug(e.target.value)}
          placeholder="Room slug (blank = every room)"
          aria-label="Room slug, blank for global"
          className="rounded-xl border border-border/60 bg-white/[0.03] px-3 py-2 text-sm text-body outline-none placeholder:text-body-700 focus:border-green/50"
        />
        <input
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          placeholder="gid (uuid) or userId"
          aria-label="Banned identity"
          className="rounded-xl border border-border/60 bg-white/[0.03] px-3 py-2 text-sm text-body outline-none placeholder:text-body-700 focus:border-green/50"
        />
        <input
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          placeholder="Minutes"
          aria-label="Duration in minutes"
          inputMode="numeric"
          className="rounded-xl border border-border/60 bg-white/[0.03] px-3 py-2 text-sm text-body outline-none placeholder:text-body-700 focus:border-green/50"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (shown in the log)"
          aria-label="Reason"
          className="rounded-xl border border-border/60 bg-white/[0.03] px-3 py-2 text-sm text-body outline-none placeholder:text-body-700 focus:border-green/50"
        />
      </div>
      <button
        type="button"
        onClick={() => void submit()}
        disabled={creating}
        className="mt-3 rounded-full bg-red/20 px-4 py-2 text-sm font-medium text-red hover:bg-red/30 disabled:opacity-50"
      >
        Ban identity
      </button>
      {identityError && (
        <p role="alert" className="mt-2 text-xs text-red">Identity must be a guest uuid or a 24-character user id.</p>
      )}

      <ul className="mt-4 flex flex-col gap-2">
        {bans?.map((ban) => (
          <li key={ban._id} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.02] px-3 py-2">
            <span className="min-w-0 text-sm text-body-300">
              <span className="font-medium text-body">{ban.roomSlug ?? 'all rooms'}</span>
              {' · '}
              <span className="truncate font-mono text-xs">{ban.gid ?? ban.userId}</span>
              {' · '}
              {timeLeft(ban.until)} · {ban.reason}
            </span>
            <button
              type="button"
              onClick={() => void liftBan(ban._id)}
              disabled={liftingId === ban._id}
              className="shrink-0 text-xs font-medium text-green hover:underline disabled:opacity-50"
            >
              Lift
            </button>
          </li>
        ))}
        {bans?.length === 0 && <li className="text-sm text-body-700">No active bans.</li>}
      </ul>
    </section>
  );
};

export default Bans;
