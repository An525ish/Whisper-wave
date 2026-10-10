import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

type Props = {
  roomsLive: boolean;
  memesLive: boolean;
  liveCount: number;
  quotaExhausted: boolean;
  onDoorClick: (id: string) => void;
};

/**
 * Three doors, one glance: the launcher row. Whisper is the lit doorway,
 * rooms and memes follow with live hints or an honest "soon". Each door
 * carries its own flat glyph so the row reads as illustrated, not listed.
 */
const HomeDoors = ({ roomsLive, memesLive, liveCount, quotaExhausted, onDoorClick }: Props) => (
  <nav aria-label="Where to tonight" className="grid gap-3 sm:grid-cols-3">
    {/* ── whisper: the lit door ── */}
    <Link
      to={ROUTES.whisper}
      onClick={() => onDoorClick('whisper-door')}
      className="hw-door hw-glass hw-rim hw-sheen group relative overflow-hidden rounded-3xl p-5 text-left transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
    >
      <div aria-hidden className="hw-door__glow hw-door__glow--whisper" />
      <svg viewBox="0 0 64 64" fill="none" aria-hidden className="hw-door__glyph">
        <rect x="8" y="12" width="34" height="24" rx="12" fill="#8b6bff" opacity="0.9" />
        <rect x="14" y="20" width="16" height="4" rx="2" fill="#efeaf9" opacity="0.85" />
        <rect x="14" y="27" width="22" height="4" rx="2" fill="#efeaf9" opacity="0.45" />
        <rect x="22" y="30" width="34" height="24" rx="12" fill="#35e0c8" opacity="0.9" />
        <rect x="28" y="38" width="22" height="4" rx="2" fill="#04231f" opacity="0.5" />
        <rect x="28" y="45" width="14" height="4" rx="2" fill="#04231f" opacity="0.35" />
        <circle cx="50" cy="12" r="3.5" fill="#01c36d" />
      </svg>
      <p className="hw-eyebrow hw-eyebrow--live mt-4">
        <span aria-hidden className="hw-eyebrow__dot" />
        Anonymous 1-on-1
      </p>
      <h2 className="mt-1.5 font-display text-2xl text-white">Whisper</h2>
      <p className="mt-1 text-sm leading-relaxed text-body-300">
        {quotaExhausted
          ? 'Resting till tomorrow — the wave keeps count.'
          : 'Anonymous, one-to-one, gone when it’s over.'}
      </p>
      <p className="mt-3 text-sm font-semibold text-green">
        {quotaExhausted ? 'Back tomorrow' : 'Find someone →'}
      </p>
    </Link>

    {/* ── rooms: live water or uncharted ── */}
    {roomsLive ? (
      <Link
        to={ROUTES.rooms}
        onClick={() => onDoorClick('rooms-door')}
        className="hw-door hw-glass hw-rim hw-sheen group relative overflow-hidden rounded-3xl p-5 text-left transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
      >
        <div aria-hidden className="hw-door__glow hw-door__glow--rooms" />
        <svg viewBox="0 0 64 64" fill="none" aria-hidden className="hw-door__glyph">
          <ellipse cx="32" cy="44" rx="24" ry="10" stroke="rgba(53,224,200,0.5)" strokeWidth="2" />
          <ellipse cx="32" cy="38" rx="18" ry="8" stroke="rgba(139,107,255,0.5)" strokeWidth="2" />
          <circle cx="24" cy="20" r="6" fill="#1d1530" stroke="#b6a4ff" strokeWidth="1.5" />
          <circle cx="34" cy="17" r="7" fill="#122b28" stroke="#35e0c8" strokeWidth="1.5" />
          <circle cx="43" cy="21" r="5" fill="#1d1530" stroke="#8b6bff" strokeWidth="1.5" />
          {liveCount > 0 && <circle cx="50" cy="12" r="3.5" fill="#01c36d" />}
        </svg>
        <p className="hw-eyebrow hw-eyebrow--live mt-4">
          <span aria-hidden className="hw-eyebrow__dot" />
          Live group rooms
        </p>
        <h2 className="mt-1.5 font-display text-2xl text-white">Rooms</h2>
        <p className="mt-1 text-sm leading-relaxed text-body-300">
          {liveCount > 0
            ? `${liveCount} ${liveCount === 1 ? 'person is' : 'people are'} in open rooms right now.`
            : 'Topic rooms that open and close with the night.'}
        </p>
        <p className="mt-3 text-sm font-semibold text-green">See what’s open →</p>
      </Link>
    ) : (
      <div className="hw-door relative overflow-hidden rounded-3xl border border-dashed border-body-300/25 bg-white/[0.015] p-5">
        <svg viewBox="0 0 64 64" fill="none" aria-hidden className="hw-door__glyph opacity-60">
          <ellipse cx="32" cy="44" rx="24" ry="10" stroke="rgba(235,236,236,0.3)" strokeWidth="2" strokeDasharray="4 5" />
          <ellipse cx="32" cy="38" rx="18" ry="8" stroke="rgba(235,236,236,0.2)" strokeWidth="2" strokeDasharray="4 5" />
          <circle cx="32" cy="20" r="7" fill="none" stroke="rgba(235,236,236,0.3)" strokeWidth="1.5" />
        </svg>
        <p className="hw-eyebrow hw-eyebrow--soon mt-4">Coming soon</p>
        <h2 className="mt-1.5 font-display text-2xl text-white/80">Rooms</h2>
        <p className="mt-1 text-sm leading-relaxed text-body-300">
          Small crowds, real talk. Opening soon.
        </p>
        <p className="mt-3 inline-block rounded-full border border-dashed border-body-300/40 px-3 py-1 text-xs font-medium text-body-300">
          Uncharted · soon
        </p>
      </div>
    )}

    {/* ── memes: the tap or the teaser ── */}
    {memesLive ? (
      <Link
        to={ROUTES.memes}
        onClick={() => onDoorClick('memes-door')}
        className="hw-door hw-glass hw-rim hw-sheen group relative overflow-hidden rounded-3xl p-5 text-left transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
      >
        <div aria-hidden className="hw-door__glow hw-door__glow--memes" />
        <svg viewBox="0 0 64 64" fill="none" aria-hidden className="hw-door__glyph">
          <rect x="12" y="10" width="40" height="34" rx="10" fill="#241a34" stroke="rgba(139,107,255,0.5)" strokeWidth="1.5" />
          <circle cx="24" cy="24" r="2.5" fill="#b6a4ff" />
          <circle cx="40" cy="24" r="2.5" fill="#35e0c8" />
          <path d="M22 34 q10 8 20 0" stroke="#7dffb8" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M8 50 h48" stroke="rgba(1,195,109,0.4)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 5" />
        </svg>
        <p className="hw-eyebrow mt-4">
          <span aria-hidden className="hw-eyebrow__dot" />
          Shuffled laughs
        </p>
        <h2 className="mt-1.5 font-display text-2xl text-white">Memes</h2>
        <p className="mt-1 text-sm leading-relaxed text-body-300">
          Jokes on shuffle — no feed studying you.
        </p>
        <p className="mt-3 text-sm font-semibold text-green">Open the tap →</p>
      </Link>
    ) : (
      <div className="hw-door relative overflow-hidden rounded-3xl border border-dashed border-body-300/25 bg-white/[0.015] p-5">
        <svg viewBox="0 0 64 64" fill="none" aria-hidden className="hw-door__glyph opacity-60">
          <rect x="12" y="10" width="40" height="34" rx="10" fill="none" stroke="rgba(235,236,236,0.3)" strokeWidth="1.5" strokeDasharray="4 5" />
          <path d="M22 34 q10 8 20 0" stroke="rgba(235,236,236,0.3)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <p className="hw-eyebrow hw-eyebrow--soon mt-4">Coming soon</p>
        <h2 className="mt-1.5 font-display text-2xl text-white/80">Memes</h2>
        <p className="mt-1 text-sm leading-relaxed text-body-300">
          For when nobody’s online. Shuffling soon.
        </p>
        <p className="mt-3 inline-block rounded-full border border-dashed border-body-300/40 px-3 py-1 text-xs font-medium text-body-300">
          Uncharted · soon
        </p>
      </div>
    )}
  </nav>
);

export default HomeDoors;
