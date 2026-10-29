import AmbientBackdrop from '@/shared/components/ui/backdrop/AmbientBackdrop';
import { MEME_FLOATERS } from '../constants';
import './memesBackdrop.css';

/** Shared backdrop plus rising emoji behind the feed viewport — decorative only. */
const MemeFeedBackdrop = () => (
  <AmbientBackdrop>
    <div className="mm-floaters">
      {MEME_FLOATERS.map((f) => (
        <span
          key={`${f.glyph}-${f.left}`}
          className="mm-floater"
          style={
            {
              left: f.left,
              fontSize: f.size,
              '--mm-dur': f.duration,
              '--mm-delay': f.delay,
            } as React.CSSProperties
          }
        >
          {f.glyph}
        </span>
      ))}
    </div>
  </AmbientBackdrop>
);

export default MemeFeedBackdrop;
