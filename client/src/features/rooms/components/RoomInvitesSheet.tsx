import { useState } from 'react';
import BottomSheet from '@/shared/components/ui/BottomSheet';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { ROOM_PRIVATE } from '../constants';
import {
  useCreateInviteMutation,
  useRevokeInviteMutation,
  useRoomInvitesQuery,
  useShareInvite,
} from '../hooks/useRoomInvites';
import { useRoomInfo } from '../hooks/useRoomsQueries';
import { buildInviteTerms, canWebShare, defaultInviteFields, inviteUrl } from '../utils/inviteLink';
import RoomSheetHead from './RoomSheetHead';
import './roomSheets.css';
import './roomPrivate.css';

type Props = {
  slug: string;
  open: boolean;
  onClose: () => void;
};

/**
 * Host invite links: mint (with uses + validity), copy/share, see uses,
 * revoke. Links are the only way into unlisted and private rooms — whoever
 * holds one was personally given it. Private rooms require a use limit.
 */
const RoomInvitesSheet = ({ slug, open, onClose }: Props) => {
  const { data: invites } = useRoomInvitesQuery(slug, open);
  const { data: room } = useRoomInfo(slug, undefined, open);
  const isPrivate = room?.visibility === 'private';
  const create = useCreateInviteMutation(slug);
  const revoke = useRevokeInviteMutation(slug);
  const { copy } = useCopyToClipboard();
  const share = useShareInvite(room?.title ?? 'this room');
  const [fields, setFields] = useState(() => defaultInviteFields(false));
  const [touched, setTouched] = useState(false);
  // Until the host edits, follow the room kind's defaults (info may load after the sheet opens).
  const uses = touched ? fields.uses : defaultInviteFields(isPrivate).uses;
  const days = touched ? fields.days : defaultInviteFields(isPrivate).days;
  const built = buildInviteTerms(isPrivate, uses, days);
  const freshLink = create.data ? inviteUrl(slug, create.data.data.invite.token) : null;

  const edit = (next: Partial<typeof fields>) => {
    setTouched(true);
    setFields({ uses, days, ...next });
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
              <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          }
        />
        <p className="rm-sheetsub">
          {isPrivate
            ? `Private room: only signed-in people with a link get in, up to ${ROOM_PRIVATE.MAX_PEOPLE} in total. Every link needs a use limit (max ${ROOM_PRIVATE.INVITE_MAX_USES}) and expires within ${ROOM_PRIVATE.INVITE_MAX_DAYS} days.`
            : 'Anyone with a link can walk straight in. Each join uses it up once against its limit.'}
        </p>
        <div className="rm-terms">
          <label className="rm-terms__field">
            <span>Uses{isPrivate ? '' : ' (blank = unlimited)'}</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={isPrivate ? ROOM_PRIVATE.INVITE_MAX_USES : 1000}
              value={uses}
              onChange={(e) => edit({ uses: e.target.value })}
            />
          </label>
          <label className="rm-terms__field">
            <span>Valid for (days)</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={ROOM_PRIVATE.INVITE_MAX_DAYS}
              value={days}
              onChange={(e) => edit({ days: e.target.value })}
            />
          </label>
        </div>
        {'error' in built && <p role="alert" className="rm-terms__error">{built.error}</p>}
        <button
          type="button"
          onClick={() => 'terms' in built && create.mutate(built.terms)}
          disabled={create.isPending || 'error' in built}
          className="rm-joinbtn"
        >
          {create.isPending ? 'Creating…' : '+ New invite link'}
        </button>
        {freshLink && (
          <div className="rm-fresh" role="status">
            <p className="rm-fresh__label">New link — shown once</p>
            <code className="rm-fresh__url">{freshLink}</code>
            <div className="rm-fresh__actions">
              <button type="button" className="rm-invite__btn" onClick={(e) => copy(freshLink, e)}>
                Copy link
              </button>
              {canWebShare() && (
                <button type="button" className="rm-invite__btn" onClick={() => share(freshLink)}>
                  Share…
                </button>
              )}
            </div>
          </div>
        )}

        <ul className="rm-invites" aria-label="Active invite links">
          {invites?.map((invite, i) => (
            <li key={invite.id} className="rm-invite">
              <span className="rm-invite__meta">
                <b>{invite.maxUses === null ? 'Unlimited' : `${invite.uses}/${invite.maxUses} used`}</b>
                {' · '}
                {invite.expiry}
              </span>
              <button
                type="button"
                onClick={() => revoke.mutate(invite.id)}
                disabled={revoke.isPending}
                aria-label={`Revoke invite link ${i + 1}`}
                className="rm-invite__btn rm-invite__btn--danger"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
        {invites?.length === 0 && <p className="rm-emptyline">No links yet — mint the first one above.</p>}
      </div>
    </BottomSheet>
  );
};

export default RoomInvitesSheet;
