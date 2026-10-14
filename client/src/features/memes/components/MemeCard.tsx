import { RetryableMediaImage } from '@/shared/components/ui/media/RetryableMedia';
import { MEME_REACTIONS } from '../constants';
import { useMemeCard } from '../hooks/useMemeCard';
import { memeText } from '../utils/memeText';
import MemeReportDialog from './MemeReportDialog';
import ShareMemeSheet from './ShareMemeSheet';
import type { MemeItem } from '../types';
import './memesCard.css';

type Props = {
  item: MemeItem;
  /** Stagger index within the list — entrance delay only. */
  index?: number;
};

const ICON = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/**
 * One joke card: generated image on a glowing stage, the setup + punchline
 * in words (so the joke reads even before the image loads), tap-to-toggle
 * reactions, save, share, report and hide. Decisions live in `useMemeCard`.
 */
const MemeCard = ({ item, index = 0 }: Props) => {
  const card = useMemeCard(item);

  return (
    <article
      aria-label={`Joke in ${item.category}`}
      className="mm-card mm-rise"
      style={{ '--mm-d': `${(index % 8) * 60}ms` } as React.CSSProperties}
    >
      <div className="mm-media">
        <div aria-hidden className="mm-media__glow" />
        <RetryableMediaImage
          url={item.imageUrl}
          alt={memeText(item)}
          loading="lazy"
          wrapperClassName="mm-media__frame"
          className="mm-media__img"
        />
        <span className="mm-chip mm-chip--cat">{item.category}</span>
      </div>

      <div className="mm-body">
        <p className="mm-setup">{item.setup}</p>
        {item.delivery && <p className="mm-delivery">{item.delivery}</p>}

        <div className="mm-actions">
          <div className="mm-reacts" role="group" aria-label="Reactions">
            {MEME_REACTIONS.map((glyph) => {
              const active = card.reaction === glyph;
              return (
                <button
                  key={glyph}
                  type="button"
                  onClick={() => card.react(glyph)}
                  aria-label={`React ${glyph}`}
                  aria-pressed={active}
                  className={`mm-react${active ? ' mm-react--active' : ''}`}
                >
                  {glyph}
                </button>
              );
            })}
          </div>

          <span className="mm-spacer" />

          <button
            type="button"
            onClick={card.save}
            aria-label={card.saved ? 'Unsave' : 'Save'}
            aria-pressed={card.saved}
            title={card.saved ? 'Unsave' : 'Save'}
            className={`mm-iconbtn${card.saved ? ' mm-iconbtn--on' : ''}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden {...ICON} fill={card.saved ? 'currentColor' : 'none'}>
              <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1z" />
            </svg>
          </button>
          <button type="button" onClick={card.openShare} aria-label="Share" title="Share" className="mm-iconbtn">
            <svg viewBox="0 0 24 24" aria-hidden {...ICON}>
              <path d="M12 15V4 M8 8l4-4 4 4" />
              <path d="M5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7" />
            </svg>
          </button>
          <button type="button" onClick={card.openReport} aria-label="Report" title="Report" className="mm-iconbtn">
            <svg viewBox="0 0 24 24" aria-hidden {...ICON}>
              <path d="M5 21V4 M5 4h11l-2 4 2 4H5" />
            </svg>
          </button>
          <button type="button" onClick={card.hideIt} aria-label="Hide this one" title="Hide this one" className="mm-iconbtn">
            <svg viewBox="0 0 24 24" aria-hidden {...ICON}>
              <path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c7 0 11 8 11 8a18.6 18.6 0 0 1-2.2 3.1M6.6 6.6C3.8 8.3 2 13 2 13s4 8 10 8a9.6 9.6 0 0 0 4.4-1.1" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
              <path d="M3 3l18 18" />
            </svg>
          </button>
        </div>
      </div>
      <ShareMemeSheet item={item} open={card.shareOpen} onClose={card.closeShare} />
      <MemeReportDialog item={item} open={card.reportOpen} onClose={card.closeReport} />
    </article>
  );
};

export default MemeCard;
