import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ExternalLinkIcon from '@/shared/components/ui/icons/ExternalLink';
import { ROUTES } from '@/shared/constants/routes';
import { FEEDBACK_KINDS, HUB_APPS } from '../constants';

type View = 'phone' | 'desktop';

/** iPhone 16 Pro: 402 x 874 CSS px screen. The frame adds 10px of bezel per side. */
const SCREEN_W = 402;
const SCREEN_H = 874;
const BEZEL = 10;
const DEVICE_W = SCREEN_W + BEZEL * 2;
const DEVICE_H = SCREEN_H + BEZEL * 2;
const MAX_SCALE = 0.9;

const svg = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24', 'aria-hidden': true } as const;

const HIGHLIGHT_ICONS: Record<string, ReactNode> = {
  lock: (
    <svg {...svg} className="h-5 w-5">
      <rect x="5" y="11" width="14" height="9" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  mask: (
    <svg {...svg} className="h-5 w-5">
      <path d="M4 8c3-2 13-2 16 0v3c0 4-3 7-8 7s-8-3-8-7z" />
      <path d="M8.5 11.5h2M13.5 11.5h2" />
    </svg>
  ),
  free: (
    <svg {...svg} className="h-5 w-5">
      <path d="M20 12 12 20l-8-8V4h8z" />
      <circle cx="8" cy="8" r="1.2" />
    </svg>
  ),
};

const FEEDBACK_ICONS: Record<string, ReactNode> = {
  app: (
    <svg {...svg} className="h-5 w-5">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
    </svg>
  ),
  feedback: (
    <svg {...svg} className="h-5 w-5">
      <path d="M20 12a8 8 0 0 1-11.7 7L4 20l1-4.2A8 8 0 1 1 20 12z" />
    </svg>
  ),
  problem: (
    <svg {...svg} className="h-5 w-5">
      <path d="M6 21V4M6 5h11l-2 4 2 4H6" />
    </svg>
  ),
};

/**
 * The `/apps` page: a launchpad for other apps by the same maker.
 *
 * A shelf of app icons picks the spotlight; buttons and highlights take the
 * app's accent colour (the page background stays the hub's own). The spotlight pairs a short write-up with the live app in
 * a phone or desktop frame. Sites can block framing with their own headers, so
 * "Open in new tab" is always offered. A new app is one object in `HUB_APPS`.
 */
const AppsPage = () => {
  const [activeId, setActiveId] = useState<string>(HUB_APPS[0].id);
  const [view, setView] = useState<View>('phone');
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const app = HUB_APPS.find((a) => a.id === activeId) ?? HUB_APPS[0];
  const frameKey = `${app.id}:${view}`;
  const loaded = loadedKey === frameKey;
  const host = app.url.replace(/^https:\/\//, '').replace(/\/$/, '');
  const phone = view === 'phone';

  // The iframe always renders at the real iPhone width so the app's mobile layout
  // is what you see; the whole device is scaled down to fit narrow columns.
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(MAX_SCALE);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => setScale(Math.min(MAX_SCALE, el.clientWidth / DEVICE_W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <main
      style={{ '--accent': app.accent } as CSSProperties}
      className="relative overflow-x-clip"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 sm:px-8 sm:py-12">
        <header className="flex flex-col gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Launchpad</p>
            <h1 className="mt-2 font-serif text-4xl leading-[1.04] text-body sm:text-6xl">
              Made by one person.
              <br />
              <span className="hw-iri italic">Try them here.</span>
            </h1>
          </div>

          {/* The shelf: pick an app, or tap the dashed tile to ask for the next one. */}
          <div role="tablist" aria-label="Apps" className="flex flex-wrap items-center gap-3">
            {HUB_APPS.map((a) => {
              const on = a.id === app.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setActiveId(a.id)}
                  className={`group flex items-center gap-3 rounded-2xl border py-2 pl-2 pr-5 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                    on
                      ? 'border-[var(--accent)]/60 bg-[var(--accent)]/[0.12] shadow-[0_10px_30px_-12px_var(--accent)]'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.07]'
                  }`}
                >
                  <img src={a.icon} alt="" className="h-11 w-11 rounded-xl bg-black/40 object-cover" />
                  <span className="text-left">
                    <span className="block text-sm font-semibold text-body">{a.name}</span>
                    <span className="block text-[11px] text-body-700">{on ? 'Showing now' : 'Tap to open'}</span>
                  </span>
                </button>
              );
            })}
            <Link
              to={ROUTES.feedback}
              state={{ kind: 'app' }}
              className="flex items-center gap-3 rounded-2xl border border-dashed border-white/20 py-2 pl-2 pr-5 text-body-700 transition hover:border-white/40 hover:text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.04] text-xl">+</span>
              <span className="text-left">
                <span className="block text-sm font-semibold">Your idea</span>
                <span className="block text-[11px]">Suggest the next app</span>
              </span>
            </Link>
          </div>
        </header>

        <section aria-label={app.name} className="grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
          <div className="flex flex-col gap-7">
            <div className="flex items-center gap-4">
              <img src={app.icon} alt="" className="h-16 w-16 rounded-2xl bg-black/40 object-cover shadow-[0_12px_32px_-10px_var(--accent)]" />
              <div className="min-w-0">
                <h2 className="font-serif text-4xl leading-none text-body">{app.name}</h2>
                <p className="mt-1.5 text-sm text-[var(--accent)]">{app.tagline}</p>
              </div>
            </div>

            <ul aria-label="Highlights" className="flex flex-wrap gap-2">
              {app.highlights.map((h) => (
                <li
                  key={h.label}
                  title={h.note}
                  className="flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/[0.08] py-1.5 pl-2.5 pr-3.5 text-[13px] font-medium text-body"
                >
                  <span className="text-[var(--accent)] [&>svg]:h-4 [&>svg]:w-4">{HIGHLIGHT_ICONS[h.icon]}</span>
                  {h.label}
                </li>
              ))}
            </ul>

            <p className="text-[15px] leading-relaxed text-body">{app.about}</p>

            {/* The "why" as a pull quote. */}
            <figure className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 pl-6">
              <span aria-hidden className="absolute inset-y-4 left-0 w-[3px] rounded-full bg-[var(--accent)]" />
              <figcaption className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">Why I built it</figcaption>
              <blockquote className="mt-2 font-serif text-[1.15rem] leading-snug text-body">{app.why}</blockquote>
            </figure>


            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[#14110a] shadow-[0_12px_30px_-10px_var(--accent)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                Open {app.name}
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
              <Link
                to={ROUTES.feedback}
                state={{ kind: 'feedback' }}
                className="text-sm font-medium text-body-700 underline-offset-4 transition hover:text-body hover:underline"
              >
                Tell me what you think
              </Link>
            </div>

            <p className="text-sm italic leading-relaxed text-body-700">
              <span className="mb-1 block text-[11px] font-semibold not-italic uppercase tracking-[0.16em] text-[var(--accent)]">
                A note from me
              </span>
              Built in the hours I should have spent sleeping.
              <br />
              If something breaks, it's not a feature, it's a bug. Tell me and I'll fix it.
            </p>
          </div>

          {/* The stage: live app in a phone or desktop frame, floating with a soft shadow. */}
          <div className="flex flex-col items-center gap-4">
            <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 md:flex" role="group" aria-label="Preview size">
              {(['phone', 'desktop'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition ${
                    view === v ? 'bg-[var(--accent)] text-[#14110a]' : 'text-body-700 hover:text-body'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <div ref={stageRef} className="relative flex w-full justify-center">
              {phone ? (
                <div style={{ width: DEVICE_W * scale, height: DEVICE_H * scale }}>
                  <div
                    style={{ width: DEVICE_W, height: DEVICE_H, transform: `scale(${scale})`, transformOrigin: 'top left', padding: BEZEL }}
                    className="relative overflow-hidden rounded-[3.4rem] border border-white/20 bg-[#0b0e13] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95),inset_0_0_0_2px_rgba(255,255,255,0.05)]"
                  >
                    <div className="relative h-full w-full overflow-hidden rounded-[2.7rem] bg-black">
                      {loaded ? null : (
                        <div className="absolute inset-0 grid place-items-center text-sm text-body-700" aria-live="polite">
                          Loading {app.name}...
                        </div>
                      )}
                      <iframe
                        key={frameKey}
                        src={app.url}
                        title={app.name}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                        onLoad={() => setLoadedKey(frameKey)}
                        className={`h-full w-full border-0 bg-white transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative flex h-[26rem] w-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0b0e13] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95)] sm:h-[34rem]">
                  <div className="flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.03] px-4 py-2.5">
                    <span aria-hidden className="flex gap-1.5">
                      <i className="h-2.5 w-2.5 rounded-full bg-white/15" />
                      <i className="h-2.5 w-2.5 rounded-full bg-white/15" />
                      <i className="h-2.5 w-2.5 rounded-full bg-white/15" />
                    </span>
                    <span className="min-w-0 flex-1 truncate rounded-full bg-black/30 px-3 py-1 text-center text-[12px] text-body-700">{host}</span>
                  </div>
                  <div className="relative min-h-0 flex-1">
                    {loaded ? null : (
                      <div className="absolute inset-0 grid place-items-center text-sm text-body-700" aria-live="polite">
                        Loading {app.name}...
                      </div>
                    )}
                    <iframe
                      key={frameKey}
                      src={app.url}
                      title={app.name}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                      onLoad={() => setLoadedKey(frameKey)}
                      className={`h-full w-full border-0 bg-white transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          aria-label="Suggestions and feedback"
          className="grid gap-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-12"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">Open inbox</p>
            <h2 className="mt-2 font-serif text-3xl leading-tight text-body sm:text-4xl">
              You decide <span className="hw-iri italic">what's next.</span>
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-body-700">
              Ask for an app, say what to fix, or tell me something felt wrong. I read everything.
            </p>
          </div>
          <ul className="flex flex-col gap-2.5">
            {FEEDBACK_KINDS.map((k) => (
              <li key={k.id}>
                <Link
                  to={ROUTES.feedback}
                  state={{ kind: k.id }}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-[var(--accent)]/50 hover:bg-[var(--accent)]/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-body-700 transition group-hover:bg-[var(--accent)]/[0.16] group-hover:text-[var(--accent)]">
                    {FEEDBACK_ICONS[k.id]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-body">{k.label}</span>
                    <span className="block text-xs leading-relaxed text-body-700">{k.hint}</span>
                  </span>
                  <span aria-hidden className="text-lg text-body-700 transition group-hover:translate-x-1 group-hover:text-[var(--accent)]">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
};

export default AppsPage;
