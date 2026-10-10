import toast from 'react-hot-toast';
import BottomSheet from '@/shared/components/ui/BottomSheet';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { useCreateInviteMutation, useRevokeInviteMutation, useRoomInvitesQuery } from '../hooks/useRoomInvites';

type Props = {
  slug: string;
  open: boolean;
  onClose: () => void;
};

const inviteUrl = (slug: string, token: string): string =>
  `${window.location.origin}/rooms/${slug}?invite=${token}`;

const expiryLabel = (expiresAt: string): string => {
  const ms = Date.parse(expiresAt) - Date.now();
  if (ms <= 0) return 'expired';
  const days = Math.floor(ms / 86_400_000);
  return days >= 1 ? `${days}d left` : `${Math.max(1, Math.floor(ms / 3_600_000))}h left`;
};

/**
 * Host invite links: mint, copy, see uses, revoke. Links are the only way
 * into unlisted rooms — whoever holds one was personally given it.
 */
const RoomInvitesSheet = ({ slug, open, onClose }: Props) => {
  const { data: invites } = useRoomInvitesQuery(slug, open);
  const create = useCreateInviteMutation(slug);
  const revoke = useRevokeInviteMutation(slug);
  const { copy } = useCopyToClipboard();

  const mint = () => {
    create.mutate(undefined, {
      onSuccess: (res) => {
        copy(inviteUrl(slug, res.data.invite.token));
        toast.success('Invite link copied — valid 7 days.');
      },
    });
  };

  return (
    <BottomSheet open={open} onClose={onClose} labelledBy="room-invites-title">
      <div className="px-5 pb-6 pt-2">
        <h2 id="room-invites-title" className="text-lg font-semibold text-white">
          Invite links
        </h2>
        <p className="mt-1 text-sm text-body-300">
          Anyone with a link can join. Each join uses it up once against its limit.
        </p>
        <button
          type="button"
          onClick={mint}
          disabled={create.isPending}
          className="mt-3 w-full rounded-3xl bg-gradient-action-button-green px-5 py-2.5 text-sm font-medium text-body transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {create.isPending ? 'Creating…' : 'New invite link'}
        </button>

        <ul className="mt-4 flex flex-col gap-2" aria-label="Active invite links">
          {invites?.map((invite) => (
            <li key={invite.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.02] px-3 py-2">
              <span className="min-w-0 text-sm text-body-300">
                {invite.maxUses === null ? 'Unlimited' : `${invite.uses}/${invite.maxUses} used`}
                {' · '}
                {expiryLabel(invite.expiresAt)}
              </span>
              <button
                type="button"
                onClick={() => revoke.mutate(invite.id)}
                className="shrink-0 text-xs font-medium text-red hover:underline"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
        {invites?.length === 0 && (
          <p className="mt-3 text-sm text-body-700">No links yet — mint the first one above.</p>
        )}
      </div>
    </BottomSheet>
  );
};

export default RoomInvitesSheet;
