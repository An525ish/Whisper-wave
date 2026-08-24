import { useManifestoReveal } from '@/hooks/landing/useManifestoReveal';

type ManifestoLineProps = {
  words: Array<{ text: string; accent?: boolean; dim?: boolean }>;
  className?: string;
  baseDelay: number;
  isVisible: boolean;
};

const ManifestoLine = ({ words, className = '', baseDelay, isVisible }: ManifestoLineProps) => (
  <span className={`manifesto-line ${className}`}>
    {words.map((word, i) => (
      <span
        key={i}
        className={`manifesto-word${word.accent ? ' manifesto-word--accent' : ''}${word.dim ? ' manifesto-word--dim' : ''}${isVisible ? ' manifesto-word--in' : ''}`}
        style={{ animationDelay: `${baseDelay + i * 90}ms` }}
        aria-hidden={false}
      >
        {word.text}
        {i < words.length - 1 ? '\u00A0' : ''}
      </span>
    ))}
  </span>
);

const ManifestoSection = () => {
  const block1 = useManifestoReveal<HTMLDivElement>();
  const block2 = useManifestoReveal<HTMLDivElement>();
  const block3 = useManifestoReveal<HTMLDivElement>();
  const block4 = useManifestoReveal<HTMLDivElement>();

  return (
    <section className="manifesto-section" aria-label="About Whisper Wave">
      {/* Ambient background — faintest green + violet orbs */}
      <div className="manifesto-section__ambience" aria-hidden>
        <div className="manifesto-section__orb manifesto-section__orb--a" />
        <div className="manifesto-section__orb manifesto-section__orb--b" />
      </div>

      {/* SVG illustration — a lone figure in the dark, sending a signal */}
      <div className="manifesto-section__illustration" aria-hidden>
        <svg viewBox="0 0 320 220" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Signal arcs emanating from figure */}
          <path d="M160 110 Q 200 70 240 110 Q 200 150 160 110" stroke="rgba(1,195,109,0.07)" strokeWidth="1" fill="none" />
          <path d="M160 110 Q 215 50 270 110 Q 215 170 160 110" stroke="rgba(1,195,109,0.05)" strokeWidth="1" fill="none" />
          <path d="M160 110 Q 230 30 300 110 Q 230 190 160 110" stroke="rgba(1,195,109,0.03)" strokeWidth="1" fill="none" />

          {/* Lone figure */}
          <circle cx="138" cy="96" r="14" fill="rgba(1,195,109,0.06)" stroke="rgba(1,195,109,0.18)" strokeWidth="1" />
          <path
            d="M124 116 Q124 136 128 140 Q133 144 138 140 Q143 144 148 140 Q152 136 152 116 Z"
            fill="rgba(1,195,109,0.04)"
            stroke="rgba(1,195,109,0.14)"
            strokeWidth="1"
          />

          {/* 2am clock suggestion */}
          <circle cx="50" cy="50" r="22" fill="rgba(42,33,54,0.6)" stroke="rgba(53,47,61,0.8)" strokeWidth="1" />
          <line x1="50" y1="50" x2="50" y2="33" stroke="rgba(235,236,236,0.25)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="50" y1="50" x2="40" y2="55" stroke="rgba(235,236,236,0.25)" strokeWidth="1.5" strokeLinecap="round" />
          <text x="50" y="82" textAnchor="middle" fontSize="8" fill="rgba(235,236,236,0.15)" fontFamily="DM Sans, sans-serif">2:14 am</text>

          {/* Three floating stars / sparks */}
          <text x="268" y="65" fontSize="10" fill="rgba(1,195,109,0.2)">✦</text>
          <text x="285" y="88" fontSize="7" fill="rgba(1,195,109,0.13)">✦</text>
          <text x="252" y="82" fontSize="6" fill="rgba(1,195,109,0.1)">✦</text>

          {/* "no feed. no score." labels in muted text */}
          <text x="28" y="168" fontSize="8" fill="rgba(235,236,236,0.1)" fontFamily="DM Sans, sans-serif">no feed.</text>
          <text x="28" y="180" fontSize="8" fill="rgba(235,236,236,0.1)" fontFamily="DM Sans, sans-serif">no score.</text>
          <text x="28" y="192" fontSize="8" fill="rgba(235,236,236,0.1)" fontFamily="DM Sans, sans-serif">just two people.</text>
        </svg>
      </div>

      <div className="manifesto-section__content">

        {/* Block 1 — The core contrast */}
        <div
          ref={block1.ref}
          className="manifesto-block"
          aria-label="Social media made you perform. We made you disappear."
        >
          <h2 className="manifesto-block__text manifesto-block__text--xl font-display">
            <ManifestoLine
              words={[
                { text: 'Social' },
                { text: 'media' },
                { text: 'made' },
                { text: 'you' },
              ]}
              baseDelay={0}
              isVisible={block1.isVisible}
            />
            <br />
            <ManifestoLine
              words={[
                { text: 'perform.' },
              ]}
              baseDelay={380}
              isVisible={block1.isVisible}
            />
          </h2>

          <h2 className="manifesto-block__text manifesto-block__text--xl font-display">
            <ManifestoLine
              words={[
                { text: 'We' },
                { text: 'made' },
                { text: 'you' },
              ]}
              baseDelay={700}
              isVisible={block1.isVisible}
            />
            <br />
            <ManifestoLine
              words={[
                { text: 'disappear.', accent: true },
              ]}
              baseDelay={1050}
              isVisible={block1.isVisible}
            />
          </h2>
        </div>

        {/* Block 2 — No feed, no likes, no score */}
        <div
          ref={block2.ref}
          className="manifesto-block manifesto-block--spaced"
          aria-label="No feed. No likes. No one keeping score."
        >
          <p className="manifesto-block__text manifesto-block__text--lg font-display">
            <ManifestoLine
              words={[
                { text: 'No', dim: true },
                { text: 'feed.' },
                { text: 'No', dim: true },
                { text: 'likes.' },
                { text: 'No', dim: true },
                { text: 'one', dim: true },
                { text: 'keeping', dim: true },
                { text: 'score.' },
              ]}
              baseDelay={0}
              isVisible={block2.isVisible}
            />
          </p>
        </div>

        {/* Block 3 — 2am */}
        <div
          ref={block3.ref}
          className="manifesto-block manifesto-block--body"
          aria-label="Whisper Wave is for the conversations that happen at 2am when nobody is watching."
        >
          <p className="manifesto-block__body-text">
            <ManifestoLine
              words={[
                { text: 'Whisper' },
                { text: 'Wave' },
                { text: 'is' },
                { text: 'for' },
                { text: 'the' },
                { text: 'conversations' },
                { text: 'that' },
                { text: 'happen' },
                { text: 'at' },
                { text: '2am' },
                { text: 'when' },
                { text: 'nobody' },
                { text: 'is' },
                { text: 'watching.' },
              ]}
              baseDelay={0}
              isVisible={block3.isVisible}
            />
          </p>
        </div>

        {/* Block 4 — The closer */}
        <div
          ref={block4.ref}
          className="manifesto-block manifesto-block--closer"
          aria-label="Just two people. One wave."
        >
          <p className="manifesto-block__text manifesto-block__text--md font-display">
            <ManifestoLine
              words={[
                { text: 'Just' },
                { text: 'two' },
                { text: 'people.' },
              ]}
              baseDelay={0}
              isVisible={block4.isVisible}
            />
          </p>
          <p className="manifesto-block__text manifesto-block__text--md font-display">
            <ManifestoLine
              words={[
                { text: 'One', accent: true },
                { text: 'wave.', accent: true },
              ]}
              baseDelay={350}
              isVisible={block4.isVisible}
            />
          </p>
        </div>

      </div>
    </section>
  );
};

export default ManifestoSection;
