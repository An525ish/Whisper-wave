import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { publicHeadcount } from '@/shared/utils/format';
import { useRoomsList } from '../hooks/useRoomsQueries';
import { isJoinable } from '../utils/roomStatus';

type Props = {
  /** The Rooms flag. Off means no card at all — dark surfaces stay invisible. */
  enabled: boolean;
  onClick: () => void;
};

/**
 * Rooms' door on the hub home. Owned here (HUB_PLAN §7.1); the hub only
 * composes it. Headcounts appear only above the public threshold — a quiet
 * room says so instead of announcing "1 person". Its `hw-*` look comes from
 * the hub home's door styles.
 */
const RoomsHubCard = ({ enabled, onClick }: Props) => {
  const { data: rooms } = useRoomsList(enabled);
  if (!enabled) return null;

  const online = (rooms ?? []).reduce((sum, room) => sum + (isJoinable(room) ? room.totalOnline : 0), 0);
  const headcount = publicHeadcount(online);

  return (
    <Link
      to={ROUTES.rooms}
      onClick={onClick}
      className="hw-door hw-glass hw-rim hw-sheen group relative overflow-hidden rounded-3xl p-5 text-left transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
    >
      <div aria-hidden className="hw-door__glow hw-door__glow--rooms" />
      <svg viewBox="0 0 64 64" fill="none" aria-hidden className="hw-door__glyph">
        <ellipse cx="32" cy="44" rx="24" ry="10" stroke="rgba(53,224,200,0.5)" strokeWidth="2" />
        <ellipse cx="32" cy="38" rx="18" ry="8" stroke="rgba(139,107,255,0.5)" strokeWidth="2" />
        <circle cx="24" cy="20" r="6" fill="#1d1530" stroke="#b6a4ff" strokeWidth="1.5" />
        <circle cx="34" cy="17" r="7" fill="#122b28" stroke="#35e0c8" strokeWidth="1.5" />
        <circle cx="43" cy="21" r="5" fill="#1d1530" stroke="#8b6bff" strokeWidth="1.5" />
        {headcount !== null && <circle cx="50" cy="12" r="3.5" fill="#01c36d" />}
      </svg>
      <p className="hw-eyebrow hw-eyebrow--live mt-4">
        <span aria-hidden className="hw-eyebrow__dot" />
        Live group rooms
      </p>
      <h2 className="mt-1.5 font-display text-2xl text-white">Rooms</h2>
      <p className="mt-1 text-sm leading-relaxed text-body-300">
        {headcount !== null
          ? `${headcount} people are in open rooms right now.`
          : 'Topic rooms that open and close with the night.'}
      </p>
      <p className="mt-3 text-sm font-semibold text-green">See what’s open →</p>
    </Link>
  );
};

export default RoomsHubCard;
