import { Link } from 'react-router-dom';
import AnimatedChatWindow from '@/components/landing/ui/AnimatedChatWindow';
import VibeNameTicker from '@/components/landing/ui/VibeNameTicker';

const HeroSection = () => {
  return (
    <section className="landing-hero" aria-label="Whisper Wave hero">
      {/* Atmospheric background */}
      <div className="landing-hero__ambience" aria-hidden>
        <div className="landing-hero__orb landing-hero__orb--a" />
        <div className="landing-hero__orb landing-hero__orb--b" />
        <div className="landing-hero__orb landing-hero__orb--c" />
        <div className="landing-hero__mesh" />
        <div className="landing-hero__grain" />

        {/* SVG illustration — signal arcs floating in background */}
        <svg
          className="landing-hero__bg-arcs"
          viewBox="0 0 900 500"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <ellipse cx="450" cy="250" rx="420" ry="230" stroke="rgba(1,195,109,0.06)" strokeWidth="1" />
          <ellipse cx="450" cy="250" rx="320" ry="170" stroke="rgba(1,195,109,0.05)" strokeWidth="1" />
          <ellipse cx="450" cy="250" rx="200" ry="110" stroke="rgba(1,195,109,0.04)" strokeWidth="1" />
          <path
            d="M60 250 C 130 180, 200 320, 270 250 S 410 180, 480 250 S 620 320, 690 250 S 830 180, 900 250"
            stroke="rgba(1,195,109,0.08)"
            strokeWidth="1"
            strokeDasharray="6 8"
          />
        </svg>
      </div>

      {/* Main content grid */}
      <div className="landing-hero__grid">
        {/* Left — Chat window */}
        <div className="landing-hero__chat-col">
          <div className="landing-hero__chat-wrap">
            <AnimatedChatWindow />
          </div>
          {/* Floating label below chat on desktop */}
          <p className="landing-hero__chat-label">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" aria-hidden>
              <circle cx="4" cy="4" r="4" />
            </svg>
            this conversation is happening right now
          </p>
        </div>

        {/* Right — Copy + CTA */}
        <div className="landing-hero__copy-col">
          <div className="landing-hero__eyebrow">
            <span className="landing-hero__eyebrow-dot" />
            anonymous · ephemeral · real
          </div>

          <h1 className="landing-hero__headline font-display">
            <span className="landing-hero__hl-line landing-hero__hl-line--1">No profile.</span>
            <span className="landing-hero__hl-line landing-hero__hl-line--2">No algorithm.</span>
            <span className="landing-hero__hl-line landing-hero__hl-line--3">
              Just a <span className="landing-hero__hl-accent">stranger.</span>
            </span>
          </h1>

          <p className="landing-hero__sub">
            Pick a vibe name. Find someone. If you vibe — connect for real.
            <br />
            If you don't — they're gone forever.
          </p>

          {/* CTA */}
          <div className="landing-hero__cta-group">
            <Link to="/auth" className="landing-hero__cta-primary">
              <span>Find Someone</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12H19M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <p className="landing-hero__cta-note">
              No sign-up needed to start
            </p>
          </div>

          {/* Live counter */}
          <div className="landing-hero__counter">
            <span className="landing-hero__counter-dot landing-hero__counter-dot--1" />
            <span className="landing-hero__counter-dot landing-hero__counter-dot--2" />
            <span className="landing-hero__counter-dot landing-hero__counter-dot--3" />
            <span className="landing-hero__counter-text">strangers online right now</span>
          </div>
        </div>
      </div>

      {/* Vibe name ticker — full width at bottom */}
      <div className="landing-hero__ticker-wrap">
        <VibeNameTicker />
      </div>

      {/* Scroll indicator */}
      <div className="landing-hero__scroll-cue" aria-hidden>
        <div className="landing-hero__scroll-line" />
        <span>scroll</span>
      </div>
    </section>
  );
};

export default HeroSection;
