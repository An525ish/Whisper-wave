import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import AmbientBackdrop from '@/shared/components/ui/backdrop/AmbientBackdrop';
import BokehCrowd from '@/shared/components/ui/backdrop/BokehCrowd';
import { ROUTES } from '@/shared/constants/routes';
import { useAuthStore } from '@/features/auth';
import { useNowWhile } from '@/shared/hooks/useNowWhile';
import { ROOM_COUNTDOWN_TICK_MS } from '../constants';
import { useRoomsPersona } from '../hooks/useRoomsPersona';
import { useRoomInfo } from '../hooks/useRoomsQueries';
import { useRoomStore } from '../stores/roomStore';
import { initialOf, roomArtVariant } from '../utils/art';
import { nextOpensLabel } from '../utils/hours';
import { isJoinable } from '../utils/roomStatus';
import type { RoomsPersona } from '../types';
import RoomDoorHero from './RoomDoorHero';
import RoomDoorScene from './RoomDoorScene';
import RoomPersonaForm from './RoomPersonaForm';
import RoomSignInPrompt from './RoomSignInPrompt';
import './roomsBackdrop.css';
import './roomJoin.css';
import './roomDoor.css';
import './roomsStates.css';

type Props = {
  slug: string;
  invite?: string;
  onJoin: (params: RoomsPersona) => void;
};

/** Page shell: the same drifting-light backdrop as the lobby, content above it. */
const Shell = ({ tone, knock = false, children }: { tone?: number; knock?: boolean; children: ReactNode }) => (
  <div className={`rmq-page${tone === undefined ? '' : ` rmq-tone--${tone}`}${knock ? ' rmq-open' : ''}`}>
    <AmbientBackdrop className="rm-bg" green={false}>
      <BokehCrowd />
    </AmbientBackdrop>
    {children}
  </div>
);

/** A single centered card for loading, missing and closed rooms. */
const StateCard = ({ title, sub }: { title: string; sub: string }) => (
  <Shell>
    <main className="rmq-center">
      <div className="rmq-state rmq-state--center">
        <p className="rm-empty__title">{title}</p>
        <p className="rm-empty__sub">{sub}</p>
        <Link to={ROUTES.rooms} className="rm-joinbtn mt-5 inline-block w-full">
          Browse rooms
        </Link>
      </div>
    </main>
  </Shell>
);

/**
 * The room's join page: an arched gate lit in the room's colour, the room's
 * details, a join panel to pick a name and enter, and the house rules. Joining from here is the only entry:
 * the socket never sends a persona the user hasn't seen and confirmed.
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
      <Shell>
        <main className="rmq-center" aria-label="Loading room">
          <div className="rmq-state">
            <div className="rm-skel__art rm-skel__art--hero" aria-hidden />
            <div className="rm-skel__lines--spaced" aria-hidden>
              <div className="rm-skel__line" />
              <div className="rm-skel__line rm-skel__line--short" />
            </div>
          </div>
        </main>
      </Shell>
    );
  }

  if (isError || !room) {
    return <StateCard title="Room not found." sub="It may have been removed, or the link is wrong." />;
  }

  if (!isJoinable(room)) {
    return (
      <StateCard
        title="This room is closed."
        sub={`${room.title} keeps hours. ${nextOpensLabel(room.hours, now)}.`}
      />
    );
  }

  return (
    <Shell tone={roomArtVariant(room.slug)} knock={knock}>
      <main className="rmq-main">
        <Link to={ROUTES.rooms} className="rm-backlink">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All rooms
        </Link>

        <div className="rmq-grid">
          <RoomDoorScene initial={initialOf(room.title)} />

          <div className="rmq-info">
            <RoomDoorHero room={room} now={now} />

            <div className="rmq-join">
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
          </div>
        </div>

        <section aria-label="House rules" className="rmq-rules">
          <header>
            <h2 className="rmq-rules__label">House rules</h2>
            <p>Read these before you join.</p>
          </header>
          <ol>
            {room.rules.map((rule, i) => (
              <li key={`${i}-${rule}`}>{rule}</li>
            ))}
          </ol>
        </section>
      </main>
    </Shell>
  );
};

export default RoomRulesSheet;
