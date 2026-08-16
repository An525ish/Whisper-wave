import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth';

const GhostIcon = ({ className = 'size-4' }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 2a8 8 0 0 1 8 8v9.5l-2.5-2-2 2-2-2-2 2-2-2-2.5 2V10A8 8 0 0 1 12 2zm-2 7a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
  </svg>
);

type Rule = { label: string; kind: 'frozen' | 'sends' };

const RULES: Rule[] = [
  { label: 'Online presence', kind: 'frozen' },
  { label: 'lastSeen timestamp', kind: 'frozen' },
  { label: 'Read receipts & unread', kind: 'frozen' },
  { label: 'Typing indicators', kind: 'frozen' },
  { label: 'Message sends', kind: 'sends' },
];

const GhostBanner = () => {
  const user = useAuthStore((s) => s.user);
  const actAsUser = useAuthStore((s) => s.actAsUser);
  const setActAsUser = useAuthStore((s) => s.setActAsUser);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="fixed right-0 top-1/2 z-50 -translate-y-1/2"
    >
      {/* Dialog — anchored beside the pill */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ghost mode"
        aria-hidden={!open}
        className={[
          'absolute right-[calc(100%+10px)] top-1/2 w-64 -translate-y-1/2',
          'origin-right rounded-2xl border border-blue/30 bg-primary/95 shadow-xl shadow-blue/15 backdrop-blur-xl',
          'transition-all duration-200 ease-out',
          open
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0',
        ].join(' ')}
      >
        {/* caret pointing at pill */}
        <span
          className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rotate-45 border-r border-t border-blue/30 bg-primary/95"
          aria-hidden
        />

        <div className="relative p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-blue">
            Ghost mode
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-body">
            @{user?.username ?? '…'}
          </p>

          <ul className="mt-3.5 space-y-2">
            {RULES.map((rule) => {
              const allowed = rule.kind === 'sends' && actAsUser;
              const blocked = rule.kind === 'sends' && !actAsUser;
              return (
                <li
                  key={rule.label}
                  className={[
                    'flex items-center gap-2 text-xs transition-colors duration-200',
                    allowed ? 'text-blue' : 'text-body-300',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'grid size-4 shrink-0 place-items-center rounded-full text-[10px] font-bold',
                      rule.kind === 'frozen'
                        ? 'bg-blue/15 text-blue'
                        : allowed
                          ? 'bg-blue/20 text-blue'
                          : 'bg-body-300/10 text-body-300/50',
                    ].join(' ')}
                    aria-hidden
                  >
                    {blocked ? '×' : '✓'}
                  </span>
                  <span className={blocked ? 'line-through opacity-50' : ''}>
                    {rule.label}
                  </span>
                  {allowed && (
                    <span className="ml-auto rounded-full bg-blue/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue">
                      on
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="my-3.5 h-px bg-border/40" />

          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-body">Act as user</p>
              <p className="text-[11px] text-body-300">
                {actAsUser ? 'Sends allowed' : 'Read-only'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={actAsUser}
              onClick={() => setActAsUser(!actAsUser)}
              className={[
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
                actAsUser ? 'bg-blue' : 'bg-body-300/25',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-block size-3.5 rounded-full bg-white shadow transition-transform duration-200',
                  actAsUser ? 'translate-x-4' : 'translate-x-0.5',
                ].join(' ')}
              />
            </button>
          </div>

          <p className="mt-3 text-[10px] leading-relaxed text-body-300/70">
            Session expires in 2 h. Other actions still affect the real account.
          </p>
        </div>
      </div>

      {/* Small assistive pill — flush right */}
      <button
        type="button"
        aria-label={open ? 'Close ghost mode' : 'Open ghost mode'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={[
          'relative flex h-11 w-7 items-center justify-center rounded-l-full',
          'border border-r-0 border-blue/35 bg-blue/15 shadow-lg shadow-blue/10 backdrop-blur-md',
          'text-blue transition-colors hover:bg-blue/25',
          open ? 'bg-blue/25' : '',
        ].join(' ')}
      >
        <span className="absolute -left-0.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-blue animate-pulse" aria-hidden />
        <GhostIcon />
      </button>
    </div>
  );
};

export default GhostBanner;
