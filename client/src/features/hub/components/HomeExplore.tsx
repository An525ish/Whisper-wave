import { MemesHubCard } from '@/features/memes';
import { RoomsHubCard } from '@/features/rooms';
import HomeAppsBand from './HomeAppsBand';
import HomeGamesSoon from './HomeGamesSoon';

type Props = {
  roomsLive: boolean;
  memesLive: boolean;
  onCardClick: (id: string) => void;
};

/**
 * Below the hero: a titled run of open sections, one per surface, each with its
 * own layout and no boxes (hairlines and colour washes separate them). Each is owned by its feature (HUB_PLAN §7.1); this only stacks them.
 * Whisper is not here (the hero is its door). A dark surface renders no section.
 * Games has no surface (D7), so it gets a "coming soon" band. With neither
 * Rooms nor Memes live there is nothing to explore, so nothing renders.
 */
const HomeExplore = ({ roomsLive, memesLive, onCardClick }: Props) => {
  if (!roomsLive && !memesLive) return null;

  return (
    <section aria-labelledby="hw-explore-title" className="hw-explore">
      <header className="hw-explore__head">
        <p className="hw-hud flex items-center gap-2 text-body-300">
          <span aria-hidden className="h-1 w-1 rounded-full bg-green" />
          Explore
        </p>
        <h2 id="hw-explore-title" className="mt-2 font-display text-3xl text-white md:text-5xl">
          More ways to <span className="hw-iri italic">hang out</span>
        </h2>
      </header>
      <RoomsHubCard enabled={roomsLive} onClick={() => onCardClick('rooms-door')} />
      <MemesHubCard enabled={memesLive} onClick={() => onCardClick('memes-door')} />
      <HomeGamesSoon />
      <HomeAppsBand />
    </section>
  );
};

export default HomeExplore;
