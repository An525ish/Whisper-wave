import { useState } from 'react';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { RADAR_BLIP_SLOTS } from '../constants';
import {
  arrangeFloatSpots,
  buildRadarFloatItems,
  type RadarFloatItem,
  type RadarFloatSpot,
} from '../utils/radarFloat';
import AnonFigure from './AnonFigure';
import type { VibeTag } from '../types';
import type { CSSProperties } from 'react';
import './waitingRadar.css';

type Props = {
  /** Approximate number of people queued, including you. */
  queueSize: number | null;
  vibeTags: VibeTag[];
  /** Nobody else is here: the radar keeps scanning but stays honest and calm. */
  quiet: boolean;
};

type FloatLayout = { items: RadarFloatItem[]; spots: RadarFloatSpot[] };

function buildLayout(vibeTags: VibeTag[]): FloatLayout {
  const items = buildRadarFloatItems(vibeTags);
  const seed = vibeTags.length > 0 ? `tags:${vibeTags.join('|')}` : 'whispers:void';
  return { items, spots: arrangeFloatSpots(items, seed) };
}

/**
 * Searching-stage scene under the chat bubbles.
 *
 * Centre: one anon face just below the green pulse. Arc: chip · anon · chip ·
 * anon · chip (never two tags beside each other). Whisper stand-ins when they
 * joined with no tags. Bottom wave kept clear. Always visible, light bob.
 *
 * Decorative — the parent stage is `aria-hidden`.
 */
export default function WaitingRadar({ queueSize, vibeTags, quiet }: Props) {
  const calm = useMediaQuery('(prefers-reduced-motion: reduce)');
  const others = Math.max(0, (queueSize ?? 0) - 1);
  const blips = RADAR_BLIP_SLOTS.slice(0, others);
  const layoutKey = vibeTags.join('|') || 'whispers';

  const [layout, setLayout] = useState(() => buildLayout(vibeTags));
  const [lockedKey, setLockedKey] = useState(layoutKey);

  if (lockedKey !== layoutKey) {
    setLockedKey(layoutKey);
    setLayout(buildLayout(vibeTags));
  }

  const { items: floatItems, spots } = layout;

  return (
    <div className={`wr-radar${quiet ? ' wr-radar--quiet' : ''}`}>
      <div className="wr-sweep" />
      <span className="wr-ping" />
      <span className="wr-ping wr-ping--late" />

      <svg className="wr-blips" viewBox="0 0 360 360" fill="none">
        {blips.map((slot, i) => (
          <g key={slot.x} className="wr-blip" style={{ animationDelay: `${i * 0.7}s` }}>
            <circle className="wr-blip__halo" cx={slot.x} cy={slot.y} r="9" />
            <circle className="wr-blip__dot" cx={slot.x} cy={slot.y} r="3.2" />
          </g>
        ))}
      </svg>

      <div className="wr-floats">
        {floatItems.map((item, i) => {
          const spot = spots[i] ?? spots[0];
          const inner = item.kind === 'figure' && item.inner;
          return (
            <div
              key={item.key}
              className={`wr-float${inner ? ' wr-float--inner' : ''}${calm ? ' wr-float--still' : ''}`}
              style={
                {
                  top: spot.top,
                  left: spot.left,
                  animationDelay: `${i * 0.4}s`,
                } as CSSProperties
              }
            >
              {item.kind === 'figure' ? (
                <span
                  className={`wr-figure wr-figure--${item.tone}${inner ? ' wr-figure--inner' : ''}`}
                  style={{ '--wr-figure-size': `${item.size}rem` } as CSSProperties}
                >
                  <AnonFigure />
                </span>
              ) : (
                <span
                  className={`wr-chip wr-chip--${item.tone}${item.kind === 'whisper' ? ' wr-chip--whisper' : ''}`}
                >
                  {item.kind === 'whisper' && <span className="wr-chip__dot" aria-hidden />}
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
