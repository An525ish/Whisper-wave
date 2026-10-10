import { useState } from 'react';
import toast from 'react-hot-toast';
import { track } from '@/shared/lib/analytics';
import { RetryableMediaImage } from '@/shared/components/ui/media/RetryableMedia';
import { MEME_EVENTS, MEME_REACTIONS } from '../constants';
import { useMemeStore } from '../stores/memeStore';
import ShareMemeSheet from './ShareMemeSheet';
import type { MemeItem } from '../types';
import './memes.css';

type Props = {
  item: MemeItem;
  /** Stagger index within the visible list — entrance delay only. */
  index?: number;
};

const shareText = (item: MemeItem): string =>
  item.delivery ? `${item.setup}\n${item.delivery}` : item.setup;

/**
 * One joke card: generated image on a glowing stage, the setup + punchline
 * in words (so the joke reads even before the image loads), tap-to-toggle
 * reactions, share, and hide. Everything local in v1 — the card never
 * needs an account.
 */
const MemeCard = ({ item, index = 0 }: Props) => {
  const reaction = useMemeStore((s) => s.reactions[item.id]);
  const toggleReaction = useMemeStore((s) => s.toggleReaction);
  const hide = useMemeStore((s) => s.hide);
  const [shareOpen, setShareOpen] = useState(false);

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
          alt={shareText(item)}
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
              const active = reaction === glyph;
              return (
                <button
                  key={glyph}
                  type="button"
                  onClick={() => {
                    toggleReaction(item.id, glyph);
                    if (!active) track(MEME_EVENTS.REACT, { reaction: glyph });
                  }}
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
            onClick={() => setShareOpen(true)}
            aria-label="Share"
            title="Share"
            className="mm-iconbtn"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 15V4 M8 8l4-4 4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 12v7a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              hide(item.id);
              track(MEME_EVENTS.HIDE, {});
              toast.success('Hidden — you won’t see this again.');
            }}
            aria-label="Hide this one"
            title="Hide this one"
            className="mm-iconbtn"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M10.6 5.1A9.8 9.8 0 0 1 12 5c7 0 11 8 11 8a18.6 18.6 0 0 1-2.2 3.1M6.6 6.6C3.8 8.3 2 13 2 13s4 8 10 8a9.6 9.6 0 0 0 4.4-1.1"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M3 3l18 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
      <ShareMemeSheet item={shareOpen ? item : null} onClose={() => setShareOpen(false)} />
    </article>
  );
};

export default MemeCard;
