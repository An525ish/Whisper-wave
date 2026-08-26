import { useScrollStory } from '@/hooks/landing/useScrollStory';
import StoryVisual from '@/components/landing/ui/StoryVisual';
import { cn } from '@/utils/cn';

/**
 * Section 2 — "the loop": how Whisper Wave works, as a genuine three-step
 * sequence (so the numbering is real information, not decoration). The
 * structural idea is a colour journey that mirrors the product thesis —
 * violet (anonymous) → teal (matched) → the reserved spark green (connect) —
 * carried by the active step's numeral, its rail node, the ambient glow, and
 * the morphing glass visual. On desktop the visual is sticky and cross-fades
 * as chapters scroll past (tracked by `useScrollStory` via IntersectionObserver);
 * on mobile each chapter carries its own inline visual.
 */

type Tone = 'violet' | 'teal' | 'spark';

const TONE: Record<Tone, { label: string; num: string; dot: string; detail: string; glow: string }> = {
  violet: {
    label: 'text-lw-violet-2',
    num: 'text-lw-violet',
    dot: 'bg-lw-violet',
    detail: 'text-lw-violet-2',
    glow: 'bg-[radial-gradient(circle,rgba(139,107,255,0.5),transparent_62%)]',
  },
  teal: {
    label: 'text-lw-teal-2',
    num: 'text-lw-teal',
    dot: 'bg-lw-teal',
    detail: 'text-lw-teal-2',
    glow: 'bg-[radial-gradient(circle,rgba(53,224,200,0.42),transparent_64%)]',
  },
  spark: {
    label: 'text-lw-spark',
    num: 'text-lw-spark',
    dot: 'bg-lw-spark',
    detail: 'text-lw-spark',
    glow: 'bg-[radial-gradient(circle,rgba(1,195,109,0.4),transparent_64%)]',
  },
};

const CHAPTERS = [
  {
    number: '01',
    tone: 'violet',
    title: 'Pick a vibe name.',
    body: [
      'No real name. No photo. No profile to judge.',
      'Type something that feels like tonight — midnight_fox, chaos_agent, soft_rain. Or grab one we generate for you.',
      "Add a couple of vibe tags. Hit Find. That's your entire identity here.",
    ],
    detail: 'Anonymous · Ephemeral · No account needed',
  },
  {
    number: '02',
    tone: 'teal',
    title: 'Matched with a stranger.',
    body: [
      'Real-time queue. We pair two people who are both looking right now.',
      'You see their display name and vibe tags. They see yours. Nothing else.',
      "No bio to overthink. No algorithm deciding if you're good enough. You either say hi or you don't.",
    ],
    detail: 'Text chat · No read receipts · Pure serendipity',
  },
  {
    number: '03',
    tone: 'spark',
    title: "If it's a vibe — connect.",
    body: [
      'One tap. A like button that sits quietly in the corner.',
      'If both of you tap it — mutual spark. "IT\'S A VIBE" screen. A connect button appears.',
      'Connect → account created → real DM unlocked. That tension between anonymous and real? That\'s the whole product.',
    ],
    detail: "Skip and they're gone forever · Connect and they're yours",
  },
] as const;

const ScrollStorySection = () => {
  const { activeChapter, setChapterRef } = useScrollStory(CHAPTERS.length);

  return (
    <section
      aria-label="How Whisper Wave works"
      className="relative isolate overflow-hidden bg-background px-[clamp(16px,4vw,40px)] py-[clamp(72px,12vh,140px)] font-lw-body text-lw-text"
    >
      {/* Top hairline — a quiet seam from the hero above */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--color-lw-line)_30%,rgba(139,107,255,0.35)_50%,var(--color-lw-line)_70%,transparent)]" />

      {/* Ambient glow that warms violet → teal → spark with the active step */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        {(Object.keys(TONE) as Tone[]).map((t, i) => (
          <div
            key={t}
            className={cn(
              'absolute left-1/2 top-[32%] size-[min(68vh,600px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 mix-blend-screen blur-[80px] transition-opacity duration-700 min-[960px]:left-[32%]',
              TONE[t].glow,
              activeChapter === i + 1 && 'opacity-60',
            )}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative mx-auto mb-[clamp(40px,7vh,80px)] max-w-[1180px]">
        <p className="flex items-center gap-3 font-lw-mono text-[0.72rem] uppercase tracking-[0.22em] text-lw-text-faint">
          <span className="h-px w-8 bg-lw-line" />
          the loop
        </p>
        <h2 className="mt-4 font-lw-display text-[clamp(2.1rem,5vw,3.4rem)] font-medium leading-[1.05] tracking-[-0.02em] text-lw-text">
          How it works.
        </h2>
        <p className="mt-3 max-w-[46ch] text-[clamp(0.95rem,1.6vw,1.08rem)] leading-relaxed text-lw-text-dim">
          Three steps from a made-up name to a real connection — no profile, no pressure, no trace.
        </p>
      </header>

      {/* Layout: sticky visual + scrolling chapters */}
      <div className="relative mx-auto grid max-w-[1180px] gap-[clamp(32px,5vw,72px)] min-[960px]:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] min-[960px]:items-start">
        {/* Sticky visual — desktop */}
        <div className="hidden min-[960px]:block">
          <div className="sticky top-[100px] flex flex-col items-center gap-6">
            <div className="lw-glass lw-rim relative h-[340px] w-full max-w-[360px] overflow-hidden rounded-[28px]">
              {CHAPTERS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'absolute inset-0 transition-[opacity,translate,scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    activeChapter === i + 1
                      ? 'translate-y-0 scale-100 opacity-100'
                      : 'pointer-events-none translate-y-2 scale-[0.98] opacity-0',
                  )}
                >
                  <StoryVisual step={(i + 1) as 1 | 2 | 3} />
                </div>
              ))}
            </div>

            {/* Progress nodes */}
            <div className="flex items-center gap-2.5" aria-hidden>
              {CHAPTERS.map((chapter, i) => (
                <span
                  key={chapter.number}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    activeChapter === i + 1 ? cn('w-6', TONE[chapter.tone].dot) : 'w-1.5 bg-lw-line',
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Chapters — a real ordered sequence */}
        <ol className="relative m-0 flex list-none flex-col p-0">
          {CHAPTERS.map((chapter, i) => {
            const active = activeChapter === i + 1;
            const tone = TONE[chapter.tone];
            return (
              <li
                key={chapter.number}
                ref={setChapterRef(i) as React.RefCallback<HTMLLIElement>}
                className={cn(
                  'relative border-b border-lw-line-soft py-[clamp(36px,6vh,64px)] transition-opacity duration-300 last:border-b-0',
                  active ? 'opacity-100' : 'opacity-45',
                )}
              >
                {/* Inline visual — mobile only */}
                <div className="mb-6 min-[960px]:hidden">
                  <div className="lw-glass lw-rim relative h-[240px] w-full overflow-hidden rounded-[24px]">
                    <StoryVisual step={(i + 1) as 1 | 2 | 3} />
                  </div>
                </div>

                {/* Ghost numeral — colours in when the step is active */}
                <span
                  aria-hidden
                  className={cn(
                    'pointer-events-none absolute right-0 top-[clamp(28px,5vh,52px)] select-none font-lw-display text-[clamp(4.5rem,9vw,7.5rem)] font-medium leading-none tracking-[-0.05em] transition-[color,opacity] duration-300',
                    active ? cn(tone.num, 'opacity-[0.16]') : 'text-lw-text opacity-[0.05]',
                  )}
                >
                  {chapter.number}
                </span>

                {/* Content */}
                <div className="relative z-[1] max-w-[52ch]">
                  <p
                    className={cn(
                      'flex items-center gap-2 font-lw-mono text-[0.68rem] uppercase tracking-[0.2em] transition-colors duration-300',
                      active ? tone.label : 'text-lw-text-faint',
                    )}
                  >
                    <span
                      className={cn(
                        'size-1.5 rounded-full transition-colors duration-300',
                        active ? tone.dot : 'bg-lw-line',
                      )}
                    />
                    step {chapter.number}
                  </p>
                  <h3 className="mt-3 font-lw-display text-[clamp(1.5rem,3vw,2.15rem)] font-medium leading-[1.12] tracking-[-0.02em] text-lw-text">
                    {chapter.title}
                  </h3>
                  <div className="mt-4 flex flex-col gap-3">
                    {chapter.body.map((para, j) => (
                      <p key={j} className="text-[clamp(0.92rem,1.5vw,1.02rem)] leading-[1.7] text-lw-text-dim">
                        {para}
                      </p>
                    ))}
                  </div>
                  <p
                    className={cn(
                      'mt-5 font-lw-mono text-[0.68rem] uppercase tracking-[0.08em] transition-opacity duration-300',
                      tone.detail,
                      active ? 'opacity-90' : 'opacity-55',
                    )}
                  >
                    {chapter.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

export default ScrollStorySection;
