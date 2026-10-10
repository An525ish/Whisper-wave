import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { RetryableMediaImage } from '@/shared/components/ui/media/RetryableMedia';
import { useMemesInfinite } from '@/features/memes';

type Props = {
  onOpenFeed: () => void;
};

/**
 * The drift: a sideways hand of playable joke cards. First page only, lazy
 * images, snap scroll — the feed itself lives one tap away at /memes.
 * Each card reads like the real thing (image + setup + delivery) so the
 * joke lands here, not just the thumbnail. A slight alternating tilt keeps
 * the shuffled-deck feel; hover straightens the card.
 */
const HomeDrift = ({ onOpenFeed }: Props) => {
  // The teaser always pours filtered — it's the public face of the tap.
  const { data } = useMemesInfinite('mix', 0, false);
  const items = (data?.pages[0]?.items ?? []).slice(0, 8);

  if (items.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-2 px-1">
        <p className="hw-hud flex items-center gap-2 text-body-300">
          <span aria-hidden className="h-1 w-1 rounded-full bg-green" />
          fresh from the tap
        </p>
        <Link
          to={ROUTES.memes}
          onClick={onOpenFeed}
          className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm font-medium text-green transition hover:border-green/40 hover:bg-green/10 focus-visible:outline-2 focus-visible:outline-green"
        >
          Open the feed →
        </Link>
      </div>
      <div className="hw-driftwrap">
        <div className="hw-driftscroll scrollbar-hide">
          {items.map((item, i) => (
            <Link
              key={item.id}
              to={ROUTES.memes}
              onClick={onOpenFeed}
              aria-label={`Open memes feed, showing: ${item.setup}`}
              className="hw-memecard hw-rise group"
              style={
                {
                  '--hw-d': `${i * 60}ms`,
                  '--hw-tilt': i % 2 === 0 ? '-1.4deg' : '1.4deg',
                } as React.CSSProperties
              }
            >
              <span className="hw-memecard__img">
                <RetryableMediaImage
                  url={item.imageUrl}
                  alt=""
                  loading="lazy"
                  className="hw-memecard__photo"
                />
                <span aria-hidden className="hw-memecard__shade" />
                <span className="hw-memecard__cat">{item.category}</span>
                <span aria-hidden className="hw-memecard__num">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </span>
              <span className="hw-memecard__body">
                <span className="hw-memecard__setup">{item.setup}</span>
                {item.delivery && (
                  <span className="hw-memecard__delivery">{item.delivery}</span>
                )}
                <span className="hw-memecard__go">tap to open →</span>
              </span>
            </Link>
          ))}

          {/* end of the hand: the way into the full tap */}
          <Link
            to={ROUTES.memes}
            onClick={onOpenFeed}
            aria-label="Open the full memes feed"
            className="hw-memecard hw-memecard--more hw-rise"
            style={{ '--hw-d': `${items.length * 60}ms` } as React.CSSProperties}
          >
            <span className="hw-more__icon" aria-hidden>
              <svg viewBox="0 0 32 32" fill="none">
                <path
                  d="M4 10 h6 l3 3 -3 3 H4 M4 10 c6 0 8 12 16 12 h8 M28 22 l-4 -4 M28 22 l-4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4 22 h6 M22 10 h6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="2 4"
                  opacity="0.5"
                />
              </svg>
            </span>
            <span className="hw-memecard__body hw-more__body">
              <span className="hw-memecard__setup">Keep shuffling</span>
              <span className="hw-memecard__delivery">
                The whole tap is one tap away.
              </span>
              <span className="hw-memecard__go">Open the feed →</span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomeDrift;
