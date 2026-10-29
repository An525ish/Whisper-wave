import MemeTapArt from './MemeTapArt';
import './memesHero.css';

type Props = {
  unfiltered: boolean;
};

/** The tap-that-never-runs-dry banner at the top of the scroll panel. */
const MemeFeedHero = ({ unfiltered }: Props) => (
  <section aria-label="About the tap" className="mm-hero mm-rise">
    <div aria-hidden className="mm-hero__glow" />
    <div className="mm-hero__copy">
      <p className={`mm-hero__pill${unfiltered ? ' mm-hero__pill--raw' : ''}`}>
        <span aria-hidden className="mm-hero__pill-dot" />
        {unfiltered ? 'unfiltered · 18+' : 'fresh from the tap'}
      </p>
      <h2 className="mm-hero__title">Scroll. Snort. Repeat.</h2>
      <p className="mm-hero__sub">
        No algorithm and no feed studying you. Just jokes, shuffled.
      </p>
    </div>
    <div className="mm-hero__art">
      <MemeTapArt />
    </div>
  </section>
);

export default MemeFeedHero;
