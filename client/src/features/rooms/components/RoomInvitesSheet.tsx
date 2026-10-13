import toast from 'react-hot-toast';
import BottomSheet from '@/shared/components/ui/BottomSheet';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { useCreateInviteMutation, useRevokeInviteMutation, useRoomInvitesQuery } from '../hooks/useRoomInvites';
import RoomSheetHead from './RoomSheetHead';
import './rooms.css';

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
      <div className="rm-sheetbody">
        <RoomSheetHead
          titleId="room-invites-title"
          tone="green"
          eyebrow="Spread the word"
          title="Invite links"
          icon={
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          }
        />
        <p className="rm-sheetsub">
          Anyone with a link can walk straight in. Each join uses it up once against its limit.
        </p>
        <button
          type="button"
          onClick={mint}
          disabled={create.isPending}
          className="rm-joinbtn"
        >
          {create.isPending ? 'Creating…' : '+ New invite link'}
        </button>

        <ul className="rm-invites" aria-label="Active invite links">
          {invites?.map((invite) => (
            <li key={invite.id} className="rm-invite">
              <span className="rm-invite__meta">
                <b>{invite.maxUses === null ? 'Unlimited' : `${invite.uses}/${invite.maxUses} used`}</b>
                {' · '}
                {expiryLabel(invite.expiresAt)}
              </span>
              <button
                type="button"
                onClick={() => revoke.mutate(invite.id)}
                className="rm-invite__btn rm-invite__btn--danger"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
        {invites?.length === 0 && (
          <p className="rm-emptyline">No links yet — mint the first one above.</p>
        )}
      </div>
    </BottomSheet>
  );
};

export default RoomInvitesSheet;
