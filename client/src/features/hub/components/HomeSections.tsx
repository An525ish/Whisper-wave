import HomeDrift from './HomeDrift';
import HomeTide from './HomeTide';
import PlayIllustration from './illustrations/PlayIllustration';

type Props = {
  roomsLive: boolean;
  /** Memes surface enabled — drift strip or teaser. */
  memesLive: boolean;
  onDoorClick: (id: string) => void;
};

const headingClass = 'mt-3 font-display text-3xl text-white md:text-4xl';
const copyClass = 'mt-2 max-w-lg text-sm leading-relaxed text-body-300 md:text-base';

/**
 * The living previews: tonight's tides, a sideways taste of the tap, and
 * the games still being dreamt. Editorial headline outside, the living
 * thing itself inside a glass panel — the landing's bento rhythm, retold
 * for the hub.
 */
const HomeSections = ({ roomsLive, memesLive, onDoorClick }: Props) => (
  <>
    <section aria-label="Rooms tonight" className="hw-rise" style={{ '--hw-d': '90ms' } as React.CSSProperties}>
      <p className="hw-eyebrow hw-eyebrow--live">
        <span aria-hidden className="hw-eyebrow__dot" />
        Live rooms
      </p>
      <h2 className={headingClass}>
        Tonight on the <span className="hw-iri italic">wave.</span>
      </h2>
      <p className={copyClass}>
        Small crowds, real talk, nothing kept. Walk into a topic — or lurk until it feels right.
      </p>
      <div className="hw-glass hw-rim relative mt-5 overflow-hidden rounded-3xl p-4 md:p-6">
        <div aria-hidden className="hw-cardglow hw-cardglow--rooms" />
        <div className="relative">
          {roomsLive ? (
            <HomeTide />
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 px-5 py-10 text-center">
              <span aria-hidden className="hw-live-dot mx-auto block h-2 w-2 rounded-full bg-green" />
              <p className="mt-3 font-display text-2xl text-white">Uncharted waters.</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-body-300">
                Rooms are still being charted — whisper or shuffle till they open.
              </p>
              <p className="mt-4 inline-block rounded-full border border-dashed border-body-300/40 px-4 py-1.5 text-xs font-medium text-body-300">
                Uncharted · soon
              </p>
            </div>
          )}
        </div>
      </div>
    </section>

    <section aria-label="Memes" className="hw-rise" style={{ '--hw-d': '180ms' } as React.CSSProperties}>
      <p className="hw-eyebrow">
        <span aria-hidden className="hw-eyebrow__dot" />
        Fresh laughs
      </p>
      <h2 className={headingClass}>
        Laughs on <span className="hw-iri italic">shuffle.</span>
      </h2>
      <p className={copyClass}>
        No algorithm, no feed that studies you. Just jokes, shuffled — for when nobody&apos;s online.
      </p>
      <div className="hw-glass hw-rim relative mt-5 overflow-hidden rounded-3xl p-4 md:p-6">
        <div aria-hidden className="hw-cardglow hw-cardglow--memes" />
        <div className="relative">
          {memesLive ? (
            <HomeDrift onOpenFeed={() => onDoorClick('memes')} />
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 px-5 py-10 text-center">
              <svg viewBox="0 0 64 64" fill="none" aria-hidden className="h-14 w-14 opacity-70">
                <rect x="12" y="10" width="40" height="34" rx="10" fill="none" stroke="rgba(139,107,255,0.5)" strokeWidth="1.5" strokeDasharray="4 5" />
                <circle cx="24" cy="24" r="2.5" fill="#b6a4ff" opacity="0.7" />
                <circle cx="40" cy="24" r="2.5" fill="#35e0c8" opacity="0.7" />
                <path d="M22 34 q10 8 20 0" stroke="#7dffb8" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
              </svg>
              <p className="font-display text-2xl text-white">The tap is still filling.</p>
              <p className="max-w-sm text-sm text-body-300">
                Shuffled jokes for the quiet hours — almost ready.
              </p>
              <p className="inline-block rounded-full border border-dashed border-body-300/40 px-4 py-1.5 text-xs font-medium text-body-300">
                Uncharted · soon
              </p>
            </div>
          )}
        </div>
      </div>
    </section>

    <section aria-label="Play" className="hw-rise" style={{ '--hw-d': '270ms' } as React.CSSProperties}>
      <p className="hw-eyebrow hw-eyebrow--soon">Coming soon</p>
      <h2 className={headingClass}>
        Games are <span className="hw-iri italic">coming.</span>
      </h2>
      <p className={copyClass}>
        Tiny games to play with strangers and rivals. Still being dreamt up — the interesting kind, not the addictive kind.
      </p>
      <div className="hw-glass hw-rim relative mt-5 grid items-center gap-6 overflow-hidden rounded-3xl p-6 md:grid-cols-2 md:gap-8 md:p-8">
        <div aria-hidden className="hw-cardglow hw-cardglow--play" />
        <div className="relative">
          <ul className="flex flex-col gap-3">
            {[
              ['Quick rounds', 'Minutes, not hours. Easy to leave.'],
              ['Strangers & rivals', 'Play whoever the wave brings.'],
              ['Nothing kept', 'Scores fade like conversations.'],
            ].map(([title, sub]) => (
              <li key={title} className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-green hw-live-dot" />
                <span>
                  <span className="block text-sm font-semibold text-white">{title}</span>
                  <span className="block text-sm text-body-300">{sub}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 inline-block rounded-full border border-dashed border-body-300/40 px-4 py-1.5 text-xs font-medium text-body-300">
            Uncharted · soon
          </p>
        </div>
        <div className="relative mx-auto w-full max-w-xs rounded-3xl border border-white/[0.07] bg-black/20 p-6 md:max-w-none" role="img" aria-label="Illustration of a game die">
          <PlayIllustration />
        </div>
      </div>
    </section>
  </>
);

export default HomeSections;
