import { useState } from 'react';
import { Link } from 'react-router-dom';
import '@/shared/components/ui/backdrop/ambientBackdrop.css';
import { ROUTES } from '@/shared/constants/routes';
import { useAuthStore } from '@/features/auth';
import { useNowWhile } from '@/shared/hooks/useNowWhile';
import { ROOM_COUNTDOWN_TICK_MS } from '../constants';
import { useRoomsPersona } from '../hooks/useRoomsPersona';
import { useRoomInfo } from '../hooks/useRoomsQueries';
import { useRoomStore } from '../stores/roomStore';
import { hoursSummary, nextOpensLabel } from '../utils/hours';
import { isJoinable } from '../utils/roomStatus';
import type { RoomsPersona } from '../types';
import RoomDoorScene from './RoomDoorScene';
import RoomPersonaForm from './RoomPersonaForm';
import RoomSignInPrompt from './RoomSignInPrompt';
import './roomJoin.css';
import './roomDoor.css';
import './roomsStates.css';

type Props = {
  slug: string;
  invite?: string;
  onJoin: (params: RoomsPersona) => void;
};

const Backdrop = () => (
  <>
    <div aria-hidden className="rmq-stars" />
    <div aria-hidden className="rmq-moon" />
  </>
);

/**
 * The doorway as a door: slightly ajar, light spilling out, chatter leaking
 * through the gap. The crowd shows who's already inside; knocking (the join
 * button) swings it wider. Joining from here is the only entry — the socket
 * never sends a persona the user hasn't seen and confirmed.
 */
const RoomRulesSheet = ({ slug, invite, onJoin }: Props) => {
  const { data: room, isLoading, isError } = useRoomInfo(slug, invite);
  const user = useAuthStore((s) => s.user);
  const { persona } = useRoomsPersona();
  const connection = useRoomStore((s) => s.socketStatus);
  const joining = useRoomStore((s) => s.joinStatus === 'joining');
  const joinError = useRoomStore((s) => s.joinError);
  const [knock, setKnock] = useState(false);
  const now = useNowWhile(false, ROOM_COUNTDOWN_TICK_MS);

  if (isLoading) {
    return (
      <div className="rmq-page">
        <Backdrop />
        <main className="rmq-wrap" aria-label="Loading room">
          <div className="rmq-state mx-auto w-full max-w-md md:col-span-2">
            <div className="rm-skel__art rm-skel__art--hero" aria-hidden />
            <div className="rm-skel__lines--spaced" aria-hidden>
              <div className="rm-skel__line" />
              <div className="rm-skel__line rm-skel__line--short" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isError || !room) {
    return (
      <div className="rmq-page">
        <Backdrop />
        <main className="rmq-wrap">
          <div className="rmq-state rmq-state--center mx-auto w-full max-w-md md:col-span-2">
            <p className="rm-empty__title">No door here.</p>
            <p className="rm-empty__sub">It may have been removed — or the link is wrong.</p>
            <Link to={ROUTES.rooms} className="rm-joinbtn mt-5 inline-block w-full">
              Browse rooms
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!isJoinable(room)) {
    return (
      <div className="rmq-page">
        <Backdrop />
        <main className="rmq-wrap">
          <div className="rmq-state rmq-state--center mx-auto w-full max-w-md md:col-span-2">
            <p className="rm-empty__title">The door is shut.</p>
            <p className="rm-empty__sub">
              {room.title} keeps hours. {nextOpensLabel(room.hours, now)}.
            </p>
            <Link to={ROUTES.rooms} className="rm-joinbtn mt-5 inline-block w-full">
              Browse rooms
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const live = room.totalOnline > 0;
  const faces = Math.min(room.totalOnline, 8);

  return (
    <div className="rmq-page">
      <Backdrop />
      <div aria-hidden className="ab-grain" />
      <main className="rmq-wrap">
        <Link to={ROUTES.rooms} className="rm-backlink rmq-back">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All rooms
        </Link>

        <div className={`rmq-scene${knock ? ' rmq-open' : ''}`}>
          <RoomDoorScene />
          <div className="rmq-stageinfo">
            {live ? (
              <div className="rmq-crowd">
                <span className="rmq-faces" aria-hidden>
                  {Array.from({ length: faces }, (_, i) => (
                    <span key={i} className="rmq-face">?</span>
                  ))}
                </span>
                <p>
                  {room.totalOnline} {room.totalOnline === 1 ? 'soul' : 'souls'} inside right now
                </p>
              </div>
            ) : (
              <p className="rmq-quiet">Quiet now — you’d be the first face in the door</p>
            )}
            <div className="rm-joinpills">
              <span className="rm-officialpill">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 2l2.4 4.9 5.6.8-4 4 1 5.6-5-2.6-5 2.6 1-5.6-4-4 5.6-.8L12 2z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
                {room.official ? 'Official room' : 'Community room'}
              </span>
            </div>
            <h1 className="rm-jointitle">{room.title}</h1>
            <p className="rm-joindesc">{room.description}</p>
            <div className="rm-joinmeta">
              <span>{hoursSummary(room.hours, now)}</span>
              <span>{room.lang}</span>
            </div>
          </div>
        </div>

        <div className="rmq-side">
          <section aria-label="House rules" className="rm-rulescard">
            <h2 className="rm-rulescard__label">House rules</h2>
            <ol>
              {room.rules.map((rule, i) => (
                <li key={`${i}-${rule}`}>{rule}</li>
              ))}
            </ol>
          </section>

          {room.visibility === 'private' && !user ? (
            <RoomSignInPrompt />
          ) : (
            <RoomPersonaForm
              persona={persona}
              connection={connection}
              joining={joining}
              joinError={joinError}
              onJoin={onJoin}
              onKnockChange={setKnock}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default RoomRulesSheet;
