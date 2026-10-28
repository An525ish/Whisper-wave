import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { RetryableMediaImage } from '@/shared/components/ui/media/RetryableMedia';
import { useMemeMode } from '../hooks/useMemeMode';
import { useMemesInfinite } from '../hooks/useMemesInfinite';

type Props = {
  /** The Memes flag. Off means no panel at all, so dark surfaces stay invisible. */
  enabled: boolean;
  onClick: () => void;
};

/** Where each of the three cards sits in the fan. */
const FAN: Array<{ l: string; t: string; r: string; z: number }> = [
  { l: '0%', t: '8%', r: '-5deg', z: 1 },
  { l: '20%', t: '22%', r: '2deg', z: 2 },
  { l: '40%', t: '6%', r: '7deg', z: 3 },
];

/**
 * Memes' showcase section on the hub home. Owned here (HUB_PLAN §7.1); the hub only
 * composes it. A fan of real cards from the same stream the feed pours for this
 * viewer (first page only, lazy images). Its `hw-show*` / `hw-memefan*` look
 * comes from the hub home's explore styles.
 */
const MemesHubCard = ({ enabled, onClick }: Props) => {
  const { data: mode } = useMemeMode();
  const { data } = useMemesInfinite('mix', enabled && mode === true);
  if (!enabled) return null;

  const items = (data?.pages[0]?.items ?? []).slice(0, FAN.length);

  return (
    <section aria-label="Memes" className="hw-show hw-show--memes hw-show--flip">
      <div aria-hidden className="hw-show__ghost">Memes</div>
      <div className="hw-show__copy">
        <p className="hw-show__eyebrow">
          <span className="hw-show__num">02</span>
          <span aria-hidden className="hw-show__dot" />
          Memes
        </p>
        <h2 className="hw-show__title">
          Jokes on <span className="hw-iri italic">shuffle.</span>
        </h2>
        <p className="hw-show__desc">
          Tap through when you don&apos;t feel like talking. No feed learning from you.
        </p>
        <Link to={ROUTES.memes} onClick={onClick} className="hw-show__go">
          Open the feed
        </Link>
      </div>

      <div className="hw-show__art">
      <div className="hw-memefan">
        {FAN.map((pos, i) => {
          const item = items[i];
          return (
            <Link
              key={item?.id ?? `placeholder-${i}`}
              to={ROUTES.memes}
              onClick={onClick}
              aria-label={item ? `Open memes feed, showing: ${item.setup}` : 'Open the memes feed'}
              className="hw-memefan__card"
              style={{ '--l': pos.l, '--t': pos.t, '--r': pos.r, '--z': pos.z } as React.CSSProperties}
            >
              <span className="hw-memefan__img">
                {item && (
                  <RetryableMediaImage url={item.imageUrl} alt="" loading="lazy" className="h-full w-full" />
                )}
              </span>
              <span className="hw-memefan__text">{item ? item.setup : 'Shuffle the next one'}</span>
            </Link>
          );
        })}
      </div>

      </div>
    </section>
  );
};

export default MemesHubCard;
