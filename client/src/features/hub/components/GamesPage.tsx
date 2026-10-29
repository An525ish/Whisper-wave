import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import ExternalLinkIcon from '@/shared/components/ui/icons/ExternalLink';
import { ROUTES } from '@/shared/constants/routes';
import { GAME_TAGS, HUB_GAMES, type GameTag } from '../constants';

type Game = (typeof HUB_GAMES)[number];

const tint = (g: Game) => ({ '--g': g.hue }) as CSSProperties;
const open = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

const PersonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-3.5 w-3.5" aria-hidden>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c.8-3.6 3.5-5.5 7-5.5s6.2 1.9 7 5.5" />
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

const DiceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <circle cx="9" cy="9" r="1" fill="currentColor" />
    <circle cx="15" cy="15" r="1" fill="currentColor" />
    <circle cx="15" cy="9" r="1" fill="currentColor" />
    <circle cx="9" cy="15" r="1" fill="currentColor" />
  </svg>
);

/** The big card at the top: one game gets the spotlight. */
const Featured = ({ g }: { g: Game }) => (
  <a
    href={g.url}
    target="_blank"
    rel="noopener noreferrer"
    style={tint(g)}
    className="group relative grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] transition hover:border-[var(--g)]/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--g)] md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
  >
    <div className="relative z-10 flex flex-col justify-center gap-4 p-6 sm:p-9">
      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--g)]/[0.14] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--g)]">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--g)]" />
        Start here
      </span>
      <div>
        <h2 className="font-serif text-4xl leading-none text-body sm:text-5xl">{g.name}</h2>
        <p className="mt-3 max-w-md text-[15px] leading-relaxed text-body-700">{g.blurb}</p>
      </div>
      <ul className="flex flex-wrap gap-2 text-xs text-body-700">
        <li className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1">
          <PersonIcon />
          {g.players} players
        </li>
        <li className="rounded-full border border-white/10 px-3 py-1">Best with: {g.best}</li>
        <li className="rounded-full border border-white/10 px-3 py-1">No sign up</li>
      </ul>
      <span className="mt-1 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--g)] px-6 py-3 text-sm font-semibold text-[#14110a] shadow-[0_14px_34px_-12px_var(--g)] transition group-hover:brightness-110">
        Play {g.name}
        <ExternalLinkIcon className="h-3.5 w-3.5" />
      </span>
    </div>

    {/* Art: a tilted canvas with a guessing chat, since that is the whole game. */}
    <div aria-hidden className="relative min-h-[15rem] overflow-hidden border-t border-white/10 md:border-l md:border-t-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,color-mix(in_oklab,var(--g)_32%,transparent),transparent_65%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:linear-gradient(135deg,transparent,black)]" />
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[58%] -rotate-6 text-[7rem] drop-shadow-[0_18px_30px_rgba(0,0,0,0.5)] transition duration-500 group-hover:rotate-6 group-hover:scale-110">
        {g.emoji}
      </span>
      <span className="absolute bottom-[14%] left-[8%] rounded-2xl rounded-bl-sm bg-white/10 px-3.5 py-1.5 text-xs text-body backdrop-blur">is it a cat?</span>
      <span className="absolute bottom-[30%] right-[8%] rounded-2xl rounded-br-sm bg-white/10 px-3.5 py-1.5 text-xs text-body backdrop-blur">dog??</span>
      <span className="absolute bottom-[6%] right-[16%] rounded-2xl rounded-br-sm bg-[var(--g)] px-3.5 py-1.5 text-xs font-semibold text-[#14110a]">CAT!</span>
    </div>
  </a>
);

/** A grid card: coloured art strip on top, details below. */
const GameCard = ({ g }: { g: Game }) => (
  <a
    href={g.url}
    target="_blank"
    rel="noopener noreferrer"
    style={tint(g)}
    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-1 hover:border-[var(--g)]/50 hover:shadow-[0_24px_50px_-28px_var(--g)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--g)]"
  >
    <div aria-hidden className="relative grid h-28 place-items-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklab,var(--g)_34%,transparent),transparent_70%)]" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:16px_16px]" />
      <span className="relative -rotate-6 text-5xl drop-shadow-[0_10px_16px_rgba(0,0,0,0.45)] transition duration-300 group-hover:rotate-6 group-hover:scale-110">
        {g.emoji}
      </span>
      <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2.5 py-0.5 text-[11px] font-medium text-body backdrop-blur">{g.tag}</span>
    </div>
    <div className="flex flex-1 flex-col gap-2 p-5">
      <h3 className="text-lg font-semibold text-body">{g.name}</h3>
      <p className="text-sm leading-relaxed text-body-700">{g.blurb}</p>
      <div className="mt-auto flex items-end justify-between gap-3 pt-3 text-xs">
        <div className="text-body-700">
          <span className="flex items-center gap-1.5">
            <PersonIcon />
            {g.players}
          </span>
          <span className="mt-0.5 block text-[11px] text-body-600">Best with: {g.best}</span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--g)]/[0.14] px-3.5 py-1.5 font-semibold text-[var(--g)] transition group-hover:bg-[var(--g)] group-hover:text-[#14110a]">
          Play
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  </a>
);

/**
 * The `/games` page: free browser games worth playing with a match or a friend.
 * One spotlight, a filterable grid, and a "Surprise me" button. Every card opens
 * the game's own site in a new tab; they are not ours, so the footer says so.
 */
const GamesPage = () => {
  const [tag, setTag] = useState<GameTag>('All');
  const featured = HUB_GAMES.find((g) => 'featured' in g && g.featured);
  const games = HUB_GAMES.filter((g) => (tag === 'All' ? g !== featured : g.tag === tag));
  const count = (t: GameTag) => (t === 'All' ? HUB_GAMES.length : HUB_GAMES.filter((g) => g.tag === t).length);

  const surprise = () => open(HUB_GAMES[Math.floor(Math.random() * HUB_GAMES.length)].url);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-8 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-green">Games</p>
          <h1 className="mt-2 font-serif text-4xl leading-[1.05] text-body sm:text-5xl">
            Bored? <span className="hw-iri italic">Play something.</span>
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-body-700">
            Free games people actually play. No downloads. Match with someone on Whisper, pick one and send them the link.
          </p>
        </div>
        <button
          type="button"
          onClick={surprise}
          className="inline-flex items-center gap-2 rounded-full border border-green/40 bg-green/[0.1] px-5 py-2.5 text-sm font-semibold text-green transition hover:bg-green hover:text-white-pure focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
        >
          <DiceIcon />
          Surprise me
        </button>
      </header>

      {tag === 'All' && featured ? <Featured g={featured} /> : null}

      <div className="flex flex-col gap-4">
        <div role="tablist" aria-label="Game type" className="flex flex-wrap gap-2">
          {GAME_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tag === t}
              onClick={() => setTag(t)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[13px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green ${
                tag === t ? 'border-green/50 bg-green/[0.12] text-green' : 'border-white/10 text-body-700 hover:bg-white/[0.05] hover:text-body'
              }`}
            >
              {t}
              <span className={`text-[11px] ${tag === t ? 'text-green/70' : 'text-body-600'}`}>{count(t)}</span>
            </button>
          ))}
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((g) => (
            <li key={g.id}>
              <GameCard g={g} />
            </li>
          ))}
        </ul>
      </div>

      <footer className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:gap-5">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-white/[0.06] text-body-700">
          <InfoIcon />
        </span>
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-body">These games aren’t ours</p>
          <p className="mt-1 text-sm leading-relaxed text-body-700">
            They run on their own sites, and we can’t see what you do there. Most have public chat, so keep your real name and contact details out of it.
          </p>
        </div>
        <Link
          to={ROUTES.feedback}
          state={{ kind: 'app' }}
          className="shrink-0 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-body transition hover:border-green/40 hover:bg-green/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green sm:ml-auto"
        >
          Suggest a game
        </Link>
      </footer>
    </main>
  );
};

export default GamesPage;
