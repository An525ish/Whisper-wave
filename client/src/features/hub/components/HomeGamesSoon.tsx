/**
 * Games teaser. Games has no surface yet (D7), so this is a plain "coming soon"
 * band, not a link. Hub-owned because no feature exists to own it; when Games
 * ships, replace this with a `GamesHubCard` exported from that feature.
 */
const HomeGamesSoon = () => (
  <section aria-label="Games, coming soon" className="hw-show hw-show--games">
    <div className="hw-show__copy hw-games__copy">
      <p className="hw-show__eyebrow">
        <span className="hw-show__num">03</span>
        <span className="hw-games__soon">Coming soon</span>
      </p>
      <h2 className="hw-show__title">
        Play with <span className="hw-iri italic">someone.</span>
      </h2>
      <p className="hw-show__desc">Quick games for two, right after you match</p>
    </div>
    <div aria-hidden className="hw-games">
      <span className="hw-games__piece hw-games__piece--die">
        <i /><i /><i /><i /><i />
      </span>
      <span className="hw-games__piece hw-games__piece--ring" />
      <span className="hw-games__piece hw-games__piece--x">×</span>
      <span className="hw-games__piece hw-games__piece--tri" />
      <span className="hw-games__piece hw-games__piece--card">?</span>
    </div>
  </section>
);

export default HomeGamesSoon;
