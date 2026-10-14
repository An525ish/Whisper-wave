import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { useCreateInviteMutation } from '../hooks/useRoomInvites';
import { useMyRoomsQuery } from '../hooks/useRoomsQueries';
import { buildInviteTerms, defaultInviteFields } from '../utils/inviteLink';
import type { MyRoom } from '../types';
import './roomPrivate.css';

const LockBadge = () => (
  <span className="rm-lock" title="Private — invite-only, members only">
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="6" y="11" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 11V8a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
    Private
  </span>
);

/** Public rooms share a plain link; unlisted/private mint a fresh invite (default terms) and copy it. */
const MyRoomRow = ({ room }: { room: MyRoom }) => {
  const needsInvite = room.visibility === 'unlisted' || room.visibility === 'private';
  const invite = useCreateInviteMutation(room.slug);
  const { copy } = useCopyToClipboard();
  const isPrivate = room.visibility === 'private';

  const copyLink = () => {
    if (!needsInvite) {
      copy(`${window.location.origin}${ROUTES.room(room.slug)}`);
      return;
    }
    const { uses, days } = defaultInviteFields(isPrivate);
    const built = buildInviteTerms(isPrivate, uses, days);
    if ('terms' in built) invite.mutate(built.terms);
  };

  return (
    <li className="rm-mine__row">
      <span className="rm-mine__name">
        {isPrivate && <LockBadge />}
        {room.title}
      </span>
      <button type="button" onClick={copyLink} disabled={invite.isPending} className="rm-invite__btn">
        {needsInvite ? 'Copy invite link' : 'Copy link'}
      </button>
      <Link to={ROUTES.room(room.slug)} className="rm-invite__btn">
        Open
      </Link>
    </li>
  );
};

/** "Your rooms" at the top of the lobby (signed-in): private rooms are in no lobby, so this is how hosts find them. */
const MyRoomsSection = () => {
  const { data } = useMyRoomsQuery(true);
  if (!data || data.rooms.length === 0) return null;
  return (
    <section aria-label="Your rooms" className="rm-mine">
      <h2 className="rm-mine__title">Your rooms</h2>
      <ul className="rm-mine__list">
        {data.rooms.map((room) => (
          <MyRoomRow key={room.slug} room={room} />
        ))}
      </ul>
    </section>
  );
};

export default MyRoomsSection;
