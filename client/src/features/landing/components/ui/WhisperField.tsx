/**
 * The ambient conversation. Short anonymous lines fade in around the
 * projected stranger, drift upward, and dissolve — the ephemerality *is* the
 * product (no trace). Stranger lines are violet and sit left; your lines are
 * teal and sit right, so the space reads as a live back-and-forth swirling
 * around the anonymous presence. No real headline copy here — the scene talks.
 *
 * Purely decorative → aria-hidden. Motion is `motion-safe` gated, so under
 * reduced-motion the whispers hold still at their resting opacity.
 */

type Whisper = {
  text: string;
  side: 'you' | 'stranger';
  /** position within the stage, in % */
  top: number;
  x: number;
  delay: number;
  dur: number;
};

const WHISPERS: Whisper[] = [
  { text: 'hey', side: 'stranger', top: 16, x: 4, delay: 0, dur: 8.5 },
  { text: 'no name, no history', side: 'you', top: 30, x: 70, delay: 2.4, dur: 9.5 },
  { text: "what's on your mind?", side: 'stranger', top: 52, x: 2, delay: 4.1, dur: 9 },
  { text: 'just needed to talk', side: 'you', top: 66, x: 66, delay: 1.2, dur: 10 },
  { text: 'i get that', side: 'stranger', top: 80, x: 8, delay: 5.6, dur: 8 },
  { text: "it's a vibe", side: 'you', top: 44, x: 74, delay: 6.8, dur: 9 },
];

const WhisperField = () => (
  <div className="pointer-events-none absolute inset-0 z-[2] overflow-hidden" aria-hidden>
    {WHISPERS.map((w) => (
      <div
        key={w.text}
        className="absolute motion-safe:animate-lw-whisper motion-reduce:opacity-70 will-change-transform"
        style={{ top: `${w.top}%`, left: `${w.x}%`, animationDelay: `${w.delay}s`, animationDuration: `${w.dur}s` }}
      >
        <span
          className={[
            'inline-block rounded-2xl border px-3.5 py-2 font-lw-body text-[clamp(0.8rem,1.4vw,0.98rem)] leading-none backdrop-blur-md',
            w.side === 'stranger'
              ? 'rounded-bl-sm border-lw-violet/25 bg-lw-violet/[0.14] text-lw-violet-2 shadow-[0_8px_30px_-12px_rgba(139,107,255,0.7)]'
              : 'rounded-br-sm border-lw-teal/25 bg-lw-teal/[0.12] text-lw-teal-2 shadow-[0_8px_30px_-12px_rgba(53,224,200,0.6)]',
          ].join(' ')}
        >
          {w.text}
        </span>
      </div>
    ))}
  </div>
);

export default WhisperField;
