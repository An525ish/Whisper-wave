import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { track } from '@/shared/lib/analytics';
import { ROUTES } from '@/shared/constants/routes';
import { MEME_CTA_EVERY, MEME_EVENTS } from '../constants';
import { useMemesInfinite } from '../hooks/useMemesInfinite';
import { useMemeMode } from '../hooks/useMemeMode';
import { useMemeStore } from '../stores/memeStore';
import MemeCard from './MemeCard';
import MemeModeSwitch from './MemeModeSwitch';
import MemeTapArt from './MemeTapArt';
import './memes.css';

/** Every N jokes: a way back into the funnel, honestly labelled. */
const FindSomeoneCard = () => (
  <div className="mm-cta mm-rise">
    <span className="mm-cta__orb" aria-hidden>
      <svg viewBox="0 0 32 32" fill="none">
        <circle cx="11" cy="13" r="6" fill="#1d1530" stroke="#8b6bff" strokeWidth="1.8" />
        <circle cx="21" cy="13" r="6" fill="#122b28" stroke="#35e0c8" strokeWidth="1.8" />
        <path
          d="M6 26 q5 -6 10 0 M16 26 q5 -6 10 0"
          stroke="rgba(235,236,236,0.4)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
    <p className="mm-cta__title">Feel like talking?</p>
    <p className="mm-cta__sub">Boredom is a great matchmaker.</p>
    <Link
      to={ROUTES.whisper}
      onClick={() => track(MEME_EVENTS.CTA_CLICK, { card: 'find_someone' })}
      className="mm-cta__btn"
    >
      Find someone →
    </Link>
  </div>
);

/** Slow-rising laughter behind the viewport — decorative, hidden on mobile excess. */
const FLOATERS: Array<{ e: string; left: string; size: string; dur: string; delay: string }> = [
  { e: '😂', left: '6%', size: '2rem', dur: '22s', delay: '0s' },
  { e: '🔥', left: '18%', size: '1.4rem', dur: '17s', delay: '-6s' },
  { e: '💀', left: '32%', size: '1.7rem', dur: '24s', delay: '-12s' },
  { e: '😭', left: '48%', size: '1.3rem', dur: '19s', delay: '-3s' },
  { e: '❤️', left: '63%', size: '1.2rem', dur: '21s', delay: '-9s' },
  { e: '👏', left: '76%', size: '1.5rem', dur: '18s', delay: '-15s' },
  { e: '🤣', left: '88%', size: '2.2rem', dur: '26s', delay: '-7s' },
  { e: '✨', left: '42%', size: '1.1rem', dur: '16s', delay: '-11s' },
];

/**
 * The joke tap as a fixed viewport: a sticky glass header on top, one pure
 * jokes scroll in its own themed container below — no shelves to pick, no
 * shuffle to hit. The page itself never scrolls — the feed panel does, with
 * a progress hairline under the header marking how deep you are.
 *
 * Hidden jokes never render; short pages just end the scroller.
 */
const MemeFeed = () => {
  const category = 'mix' as const;
  const hidden = useMemeStore((s) => s.hidden);
  // Stored opt-in only — absent (guests, loading, opted out) means filtered.
  const { data: mode } = useMemeMode();
  const unfiltered = mode === true;
  const trackedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useMemesInfinite(category, 0, unfiltered);

  useEffect(() => {
    if (trackedRef.current || !data) return;
    trackedRef.current = true;
    track(MEME_EVENTS.FEED_VIEW, { category });
  }, [data, category]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void fetchNextPage();
      },
      { root: scrollRef.current, rootMargin: '800px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage]);

  const items = useMemo(() => {
    const seen = new Set<number>();
    const all = data?.pages.flatMap((page) => page.items) ?? [];
    return all.filter((item) => {
      if (hidden.includes(item.id) || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [data, hidden]);

  const retry = () => {
    void refetch();
  };

  /** Progress hairline + header shadow — direct DOM writes, no re-renders. */
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    const p = max > 0 ? Math.min(1, el.scrollTop / max) : 0;
    if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
    topRef.current?.classList.toggle('mm-top--scrolled', el.scrollTop > 8);
  };

  return (
    <div className="mm-page">
      <div aria-hidden className="mm-bg">
        <div className="mm-mesh" />
        <div className="mm-glow mm-glow--violet" />
        <div className="mm-glow mm-glow--teal" />
        <div className="mm-glow mm-glow--green" />
        <div className="mm-floaters">
          {FLOATERS.map((f, i) => (
            <span
              key={i}
              className="mm-floater"
              style={
                {
                  left: f.left,
                  fontSize: f.size,
                  '--mm-dur': f.dur,
                  '--mm-delay': f.delay,
                } as React.CSSProperties
              }
            >
              {f.e}
            </span>
          ))}
        </div>
        <div className="mm-grain" />
        <div className="mm-vignette" />
      </div>

      <div className="mm-viewport">
        <header ref={topRef} className="mm-top">
          <div aria-hidden className="mm-top__wash" />
          <div className="mm-top__head">
            <div className="mm-top__title">
              <span aria-hidden className="mm-mark">
                <span />
                <span />
                <span />
                <span />
                <span />
              </span>
              <div>
                <p className="mm-eyebrow">
                  <span aria-hidden className="mm-eyebrow__dot" />
                  quiet hours ·{' '}
                  <span className={unfiltered ? 'mm-eyebrow__raw' : 'mm-eyebrow__pour'}>
                    {unfiltered ? 'unfiltered' : 'pouring'}
                  </span>
                </p>
                <h1 className="mm-toptitle">
                  The joke <span className="mm-iri">tap.</span>
                </h1>
              </div>
            </div>
            <MemeModeSwitch />
          </div>
          <div aria-hidden className="mm-progress">
            <span ref={barRef} />
          </div>
        </header>

        <div ref={scrollRef} onScroll={handleScroll} className="mm-feedscroll">
          <section aria-label="About the tap" className="mm-hero mm-rise">
            <div aria-hidden className="mm-hero__glow" />
            <div className="mm-hero__copy">
              <p className={`mm-hero__pill${unfiltered ? ' mm-hero__pill--raw' : ''}`}>
                <span aria-hidden className="mm-hero__pill-dot" />
                {unfiltered ? 'unfiltered · 18+' : 'fresh from the tap'}
              </p>
              <h2 className="mm-hero__title">Scroll. Snort. Repeat.</h2>
              <p className="mm-hero__sub">
                No algorithm, no feed studying you — just jokes, shuffled for
                the quiet hours.
              </p>
            </div>
            <div className="mm-hero__art">
              <MemeTapArt />
            </div>
          </section>

          <div className="mm-list">
            {isLoading && (
              <div aria-label="Loading memes" className="flex flex-col gap-3">
                {[0, 1].map((i) => (
                  <div key={i} className="mm-skel" aria-hidden>
                    <div className="mm-skel__media" />
                    <div className="mm-skel__line" />
                    <div className="mm-skel__line mm-skel__line--short" />
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="mm-error">
                <p className="mm-error__title">The joke tap is dry.</p>
                <p className="mm-error__sub">
                  Give it a moment, then try again.
                </p>
                <button type="button" onClick={retry} className="mm-error__btn">
                  Try again
                </button>
              </div>
            )}

            {items.map((item, index) => (
              <div key={item.id}>
                <MemeCard item={item} index={index} />
                {(index + 1) % MEME_CTA_EVERY === 0 && (
                  <div className="mt-3">
                    <FindSomeoneCard />
                  </div>
                )}
              </div>
            ))}

            <div ref={sentinelRef} aria-hidden className="h-1" />
            {isFetchingNextPage && (
              <div aria-label="Loading more" className="flex flex-col gap-3">
                <div className="mm-skel" aria-hidden>
                  <div className="mm-skel__media" />
                  <div className="mm-skel__line" />
                  <div className="mm-skel__line mm-skel__line--short" />
                </div>
              </div>
            )}
            {!hasNextPage && items.length > 0 && (
              <p className="mm-end">That&apos;s the whole tap — for now</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemeFeed;
