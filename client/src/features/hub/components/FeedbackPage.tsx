import { useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { LEGAL_CONTACT } from '@/features/landing';
import { ROUTES } from '@/shared/constants/routes';
import { FEEDBACK_KINDS, type FeedbackKind } from '../constants';
import { sendFeedback } from '../api/feedback';
import './feedback.css';

const MAX = 1500;
const input =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-body placeholder:text-body-600 focus:border-[var(--k)]/60 focus:outline-none';

/** Per-tab copy: what the maker "says" and what is worth including. */
const COPY: Record<FeedbackKind, { ask: string; tip: string; messageLabel: string; placeholder: string; send: string }> = {
  app: {
    ask: 'Got an app in mind? Give it a working title and tell me what it does.',
    tip: 'Who is it for, and what do they do in the first minute?',
    messageLabel: 'What would it do?',
    placeholder: 'A person opens it and...',
    send: 'Send my idea',
  },
  feedback: {
    ask: 'How is Whisper Wave treating you? Be blunt, I can take it.',
    tip: 'One concrete thing beats five vague ones. Good news is welcome too.',
    messageLabel: 'Your feedback',
    placeholder: 'I liked... but I wish...',
    send: 'Send feedback',
  },
  problem: {
    ask: 'Sorry about that. What broke, and where?',
    tip: 'Say what you expected instead. No passwords or private details, please.',
    messageLabel: 'What happened?',
    placeholder: 'I tapped... and then...',
    send: 'Send report',
  },
};

const svg = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24', 'aria-hidden': true } as const;
const KIND_ICON: Record<FeedbackKind, ReactNode> = {
  app: (
    <svg {...svg} className="h-6 w-6">
      <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
    </svg>
  ),
  feedback: (
    <svg {...svg} className="h-6 w-6">
      <path d="M20 12a8 8 0 0 1-11.7 7L4 20l1-4.2A8 8 0 1 1 20 12z" />
    </svg>
  ),
  problem: (
    <svg {...svg} className="h-6 w-6">
      <path d="M6 21V4M6 5h11l-2 4 2 4H6" />
    </svg>
  ),
};

/** A message from the maker: avatar plus a left-hand bubble. */
const MakerBubble = ({ children, showAvatar = true }: { children: ReactNode; showAvatar?: boolean }) => (
  <div className="fb-in flex items-end gap-3">
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] ring-1 ring-white/10 ${showAvatar ? '' : 'invisible'}`}>
      <img src="/logo-4.png" alt="" className="h-7 w-7 object-contain" />
    </span>
    <div className="max-w-[88%] rounded-3xl rounded-bl-md bg-white/[0.06] px-4 py-3 text-[14px] leading-snug text-body">{children}</div>
  </div>
);

/** Each kind has its own highlight: amber for ideas, sky for feedback, rose for problems. */
const KIND_COLOR: Record<FeedbackKind, string> = { app: '#f5b942', feedback: '#38bdf8', problem: '#fb7185' };

const AREAS = ['Whisper', 'Rooms', 'Memes', 'Chats', 'Apps', 'Sign in', 'Other'] as const;
const PROBLEM_TYPES = ['Bug', 'Complaint', 'Safety', 'Other'] as const;
const FACES = [
  { v: 1, e: '😡', l: 'Awful' },
  { v: 2, e: '🙁', l: 'Meh' },
  { v: 3, e: '😐', l: 'Okay' },
  { v: 4, e: '🙂', l: 'Good' },
  { v: 5, e: '🤩', l: 'Love it' },
] as const;

type Fields = {
  website: string; title: string; message: string; reply: string; area: string; type: string; rating: number; expected: string };
const EMPTY: Fields = { website: '', title: '', message: '', reply: '', area: '', type: '', rating: 0, expected: '' };

const Chips = ({ label, options, value, onChange }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void }) => (
  <div>
    <p className="mb-1.5 text-xs font-medium text-body-700">{label}</p>
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(value === o ? '' : o)}
          className={`rounded-full border px-3 py-1 text-[12.5px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k)] ${
            value === o ? 'border-[var(--k)]/60 bg-[var(--k)]/[0.14] text-[var(--k)]' : 'border-white/10 text-body-700 hover:bg-white/[0.05] hover:text-body'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  </div>
);

/**
 * Suggestions, feedback and problem reports, laid out as a chat with the maker:
 * pick what this is about, the maker asks the right question, you reply in the
 * fields that kind needs. Send posts to `/api/feedback`, which emails the maker
 * (nothing is stored). If that fails, a mailto link and a copy button are the
 * fallback.
 * ponytail: no admin list; add a model only if volume outgrows an inbox.
 */
const FeedbackPage = () => {
  const preset = (useLocation().state as { kind?: FeedbackKind } | null)?.kind;
  const [kind, setKind] = useState<FeedbackKind>(preset ?? 'feedback');
  const [f, setF] = useState<Fields>(EMPTY);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => {
    setSent(false);
    setFailed(false);
    setF((p) => ({ ...p, [k]: v }));
  };
  const copy = COPY[kind];
  const active = FEEDBACK_KINDS.find((k) => k.id === kind) ?? FEEDBACK_KINDS[1];
  const ready = f.message.trim().length >= 5 && (kind !== 'app' || f.title.trim().length >= 2);

  const subject = `[Whisper Wave] ${active.subject}${kind === 'app' ? `: ${f.title.trim()}` : ''}`;
  const body = () => {
    const lines: string[] = [];
    if (kind === 'app') lines.push(`App idea: ${f.title.trim()}`);
    if (kind === 'feedback') {
      if (f.rating) lines.push(`Rating: ${f.rating}/5 (${FACES[f.rating - 1].l})`);
      if (f.area) lines.push(`About: ${f.area}`);
    }
    if (kind === 'problem') {
      if (f.type) lines.push(`Type: ${f.type}`);
      if (f.area) lines.push(`Where: ${f.area}`);
    }
    lines.push('', f.message.trim());
    if (kind === 'problem' && f.expected.trim()) lines.push('', `Expected: ${f.expected.trim()}`);
    if (f.reply.trim()) lines.push('', `Reply to: ${f.reply.trim()}`);
    return lines.join('\n');
  };

  const mutation = useMutation({
    mutationFn: () =>
      sendFeedback({
        kind,
        message: f.message.trim(),
        title: kind === 'app' ? f.title.trim() || undefined : undefined,
        rating: kind === 'feedback' && f.rating ? f.rating : undefined,
        area: kind !== 'app' ? f.area || undefined : undefined,
        type: kind === 'problem' ? f.type || undefined : undefined,
        expected: kind === 'problem' ? f.expected.trim() || undefined : undefined,
        reply: f.reply.trim() || undefined,
        website: f.website || undefined,
      }),
    onSuccess: () => {
      setFailed(false);
      setF(EMPTY);
      setSent(true);
    },
    onError: () => {
      setFailed(true);
      toast.error('Couldn’t send that. You can email it instead.');
    },
  });

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (ready && !mutation.isPending) mutation.mutate();
  };

  const mailto = `mailto:${LEGAL_CONTACT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body())}`;

  const copyIt = async () => {
    try {
      await navigator.clipboard.writeText(`To: ${LEGAL_CONTACT.email}\nSubject: ${subject}\n\n${body()}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the address is shown on screen as the fallback */
    }
  };

  return (
    <main style={{ '--k': KIND_COLOR[kind] } as CSSProperties} className="h-full overflow-y-auto">
      <div className="mx-auto grid min-h-full w-full max-w-5xl gap-4 px-4 py-3 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-stretch lg:gap-8">
        {/* Left: who you are talking to, the kind picker, and the maker's question. */}
        <aside className="flex min-h-0 flex-col gap-4 lg:justify-center lg:gap-5">
          <Link to={ROUTES.apps} className="-mb-1 self-start text-xs font-medium text-body-700 transition hover:text-body">
            ← Back
          </Link>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[0.06] ring-1 ring-white/10">
              <img src="/logo-4.png" alt="" className="h-8 w-8 object-contain" />
            </span>
            <div className="min-w-0">
              <h1 className="font-serif text-xl leading-tight text-body sm:text-2xl">Talk to the maker</h1>
              <p className="hidden items-center gap-1.5 text-[11px] text-body-700 sm:flex">
                <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-green shadow-[0_0_8px_rgba(1,195,109,0.9)]" />
                Reads everything. Replies if you leave a way to.
              </p>
            </div>
          </div>

          <div role="tablist" aria-label="What is this about?" className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-2.5">
            {FEEDBACK_KINDS.map((k) => {
              const on = k.id === kind;
              return (
                <button
                  key={k.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setKind(k.id);
                    setSent(false);
                  }}
                  className={`group relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl border px-2 py-2.5 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k)] lg:flex-row lg:gap-4 lg:px-4 lg:py-3.5 lg:text-left ${
                    on
                      ? 'border-[var(--k)]/55 bg-linear-to-r from-[var(--k)]/[0.18] to-[var(--k)]/[0.04] shadow-[0_14px_32px_-18px_var(--k)]'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute inset-y-3 left-0 hidden w-[3px] rounded-full bg-[var(--k)] transition-opacity lg:block ${on ? 'opacity-100' : 'opacity-0'}`}
                  />
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg transition sm:h-9 sm:w-9 sm:rounded-xl lg:h-11 lg:w-11 ${
                      on ? 'bg-[var(--k)] text-[#10121a]' : 'bg-white/[0.06] text-body-700 group-hover:text-body'
                    } [&>svg]:h-5 [&>svg]:w-5`}
                  >
                    {KIND_ICON[k.id]}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[12px] font-semibold leading-tight lg:text-sm ${on ? 'text-[var(--k)]' : 'text-body'}`}>{k.label}</span>
                    <span className="mt-0.5 hidden text-xs leading-snug text-body-700 lg:block">{k.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div key={kind} className="hidden sm:block">
            <MakerBubble>
              {copy.ask}
              <span className="mt-1 hidden text-xs text-body-700 sm:block">{copy.tip}</span>
            </MakerBubble>
          </div>
        </aside>

        {/* Right: your reply, only the fields this kind needs. The message box takes the leftover height. */}
        <form
          key={kind}
          onSubmit={send}
          className="fb-in flex min-h-[18rem] flex-col gap-3 sm:min-h-[26rem] sm:gap-3.5 relative rounded-3xl border border-transparent p-4 [background:linear-gradient(#1a1625,#1a1625)_padding-box,linear-gradient(135deg,rgba(182,164,255,0.55),rgba(255,255,255,0.08)_55%,rgba(53,224,200,0.35))_border-box] shadow-[0_30px_60px_-38px_rgba(182,164,255,0.45)] sm:p-5 lg:my-auto lg:h-[min(40rem,100%)] lg:min-h-[32rem]"
        >
          <div className="relative hidden items-center justify-between border-b border-white/10 pb-3 sm:flex">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--k)]">
              <i aria-hidden className="h-2 w-2 rounded-full bg-[var(--k)] shadow-[0_0_10px_var(--k)]" />
              {active.label}
            </span>
            <span className="text-[11px] text-body-700">To: the maker</span>
          </div>

          {kind === 'app' ? (
            <label className="flex flex-col gap-1.5 text-xs font-medium text-body-700">
              Name it (a working title is fine)
              <input value={f.title} onChange={(e) => set('title', e.target.value.slice(0, 60))} placeholder="Something like Wavelength" className={input} />
            </label>
          ) : null}

          {kind === 'feedback' ? (
            <>
              <div>
                <p className="mb-1.5 text-xs font-medium text-body-700">How is it going so far?</p>
                <div role="radiogroup" aria-label="Rating" className="grid grid-cols-5 gap-1.5">
                  {FACES.map((x) => (
                    <button
                      key={x.v}
                      type="button"
                      role="radio"
                      aria-checked={f.rating === x.v}
                      onClick={() => set('rating', f.rating === x.v ? 0 : x.v)}
                      className={`flex flex-col items-center gap-0.5 rounded-xl border py-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k)] ${
                        f.rating === x.v ? 'border-[var(--k)]/60 bg-[var(--k)]/[0.16]' : 'border-white/10 bg-black/10 hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className={`text-xl transition ${f.rating && f.rating !== x.v ? 'opacity-50 grayscale' : ''}`}>{x.e}</span>
                      <span className="text-[10.5px] text-body-700">{x.l}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Chips label="Which part?" options={AREAS} value={f.area} onChange={(v) => set('area', v)} />
            </>
          ) : null}

          {kind === 'problem' ? (
            <>
              <Chips label="What kind of problem?" options={PROBLEM_TYPES} value={f.type} onChange={(v) => set('type', v)} />
              <Chips label="Where did it happen?" options={AREAS} value={f.area} onChange={(v) => set('area', v)} />
              {f.type === 'Safety' ? (
                <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs leading-snug text-body-700">
                  Someone behaving badly in a chat or room? The Report button there reaches the safety team faster.{' '}
                  <Link to="/report" className="text-[var(--k)] underline-offset-4 hover:underline">
                    How reporting works
                  </Link>
                </p>
              ) : null}
            </>
          ) : null}

          <label className="flex min-h-[4.25rem] flex-1 flex-col gap-1.5 text-xs font-medium text-body-700">
            {copy.messageLabel}
            <textarea
              value={f.message}
              onChange={(e) => set('message', e.target.value.slice(0, MAX))}
              placeholder={copy.placeholder}
              className={`${input} min-h-0 flex-1 resize-none`}
            />
          </label>

          {kind === 'problem' ? (
            <input
              aria-label="What did you expect? (optional)"
              value={f.expected}
              onChange={(e) => set('expected', e.target.value.slice(0, 200))}
              placeholder="What did you expect? (optional)"
              className={input}
            />
          ) : null}

          <input
            aria-label="How can I reply? (optional)"
            value={f.reply}
            onChange={(e) => set('reply', e.target.value.slice(0, 120))}
            placeholder="How can I reply? Email or handle (optional)"
            className={input}
          />

          <input
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            value={f.website}
            onChange={(e) => set('website', e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0"
            name="website"
          />

          <div className="flex items-center justify-between gap-3">
            {failed ? (
              <p className="min-w-0 text-xs leading-snug text-body-700">
                Didn’t go through. Email <a href={mailto} className="select-all font-medium text-[var(--k)] underline-offset-4 hover:underline">{LEGAL_CONTACT.email}</a>{' '}
                <button type="button" onClick={copyIt} className="font-semibold text-body underline-offset-4 hover:text-[var(--k)] hover:underline">
                  {copied ? 'Copied' : 'Copy message'}
                </button>
              </p>
            ) : sent ? (
              <p className="min-w-0 text-xs leading-snug text-body-700">
                <span className="font-semibold text-[var(--k)]">Sent.</span> Thanks. I read everything.
              </p>
            ) : (
              <p className="min-w-0 text-xs leading-snug text-body-700">
                Goes to my inbox.<span className="hidden sm:inline"> Nothing is stored here.</span>
                <span className="ml-2 text-body-600">{f.message.length}/{MAX}</span>
              </p>
            )}
            <button
              type="submit"
              disabled={!ready || mutation.isPending}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--k)] px-5 py-2.5 text-sm font-semibold text-[#10121a] shadow-[0_10px_26px_-10px_var(--k)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k)]"
            >
              {mutation.isPending ? 'Sending...' : copy.send}
              <span aria-hidden>→</span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default FeedbackPage;
