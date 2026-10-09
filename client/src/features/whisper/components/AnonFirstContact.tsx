import { avatarGradient, vibeTagLabel } from '../utils/vibeTag';
import type { Spark, VibeTag } from '../types';

type Props = {
  myName: string;
  partnerName: string;
  /** Vibes you both picked — the most honest thing to open with. */
  sharedTags: VibeTag[];
  sparks: Spark[];
  /** Fills the composer; never sends. */
  onPickSpark: (text: string) => void;
};

const OPENERS_SHOWN = 3;

const sharedLine = (tags: VibeTag[]): string => {
  const labels = tags.map(vibeTagLabel);
  const list =
    labels.length > 1 ? `${labels.slice(0, -1).join(', ')} & ${labels[labels.length - 1]}` : labels[0];
  return `You both picked ${list}. Start there.`;
};

/**
 * The empty thread: the two of you, a line about what you have in common, and
 * openers you can tap.
 *
 * The openers matter most below `lg`, where the profile panel is behind a sheet and
 * an empty composer is the only thing on screen — one tap beats a blank box.
 */
export default function AnonFirstContact({
  myName,
  partnerName,
  sharedTags,
  sparks,
  onPickSpark,
}: Props) {
  return (
    <div className="acr-empty">
      <div className="acr-empty__link" aria-hidden>
        <div className="acr-empty__orb" style={{ background: avatarGradient(myName) }}>
          {myName.charAt(0).toUpperCase()}
        </div>
        <div className="acr-empty__bridge" />
        <div className="acr-empty__orb" style={{ background: avatarGradient(partnerName) }}>
          {partnerName.charAt(0).toUpperCase()}
        </div>
      </div>

      <div>
        <p className="acr-empty__title">You&apos;re linked</p>
        <p className="acr-empty__sub">
          {sharedTags.length > 0
            ? sharedLine(sharedTags)
            : 'Two strangers, same wavelength. Break the ice — this thread doesn’t stick around.'}
        </p>
      </div>

      <ul className="acr-empty__sparks" aria-label="Ways to start">
        {sparks.slice(0, OPENERS_SHOWN).map((spark) => (
          <li key={spark.key}>
            <button
              type="button"
              className="acr-empty__spark"
              onClick={() => onPickSpark(spark.text)}
              aria-label={`Use this opener: ${spark.text}`}
            >
              <span aria-hidden>{spark.emoji}</span>
              {spark.text}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
