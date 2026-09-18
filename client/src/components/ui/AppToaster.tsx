import { Toaster, resolveValue, type Toast } from 'react-hot-toast';

type ToastKind = Toast['type'];

type AccentStyle = {
  icon: string;
  shell: string;
  progress: string;
};

const ACCENTS: Record<NonNullable<ToastKind> | 'blank', AccentStyle> = {
  success: {
    icon: 'bg-gradient-green text-white shadow-[0_4px_14px_rgba(1,195,109,0.38)]',
    shell: 'shadow-[0_14px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(1,195,109,0.12)_inset]',
    progress: 'bg-green/75',
  },
  error: {
    icon: 'bg-gradient-action-button-red text-white shadow-[0_4px_14px_rgba(255,88,99,0.28)]',
    shell: 'shadow-[0_14px_40px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,88,99,0.1)_inset]',
    progress: 'bg-red/75',
  },
  loading: {
    icon: 'bg-black-light/80 text-green ring-1 ring-inset ring-green/25',
    shell: 'shadow-[0_14px_40px_rgba(0,0,0,0.5)]',
    progress: 'bg-green/40',
  },
  custom: {
    icon: 'bg-black-light/80 text-body ring-1 ring-inset ring-white/10',
    shell: 'shadow-[0_14px_40px_rgba(0,0,0,0.5)]',
    progress: 'bg-white/20',
  },
  blank: {
    icon: 'bg-black-light/80 text-body ring-1 ring-inset ring-white/10',
    shell: 'shadow-[0_14px_40px_rgba(0,0,0,0.5)]',
    progress: 'bg-white/20',
  },
};

function accentFor(type: ToastKind): AccentStyle {
  return ACCENTS[type ?? 'blank'];
}

const SuccessIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="m4.5 8.25 2.25 2.25 4.75-4.75"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ErrorIcon = () => (
  <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M5.25 5.25l5.5 5.5M10.75 5.25l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const LoadingSpinner = () => (
  <span className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-body/20 border-t-green" />
);

function ToastIcon({ type }: { type: ToastKind }) {
  if (type === 'success') return <SuccessIcon />;
  if (type === 'error') return <ErrorIcon />;
  if (type === 'loading') return <LoadingSpinner />;
  return null;
}

function ToastBar({ t }: { t: Toast }) {
  const accent = accentFor(t.type);
  const duration = t.duration ?? 3500;
  const showProgress = duration !== Infinity && t.type !== 'loading';

  return (
    <div
      className={`pointer-events-auto relative flex w-max max-w-[calc(100vw-1.5rem)] items-center gap-2.5 overflow-hidden rounded-xl border border-white/10 bg-[rgba(33,26,42,0.88)] py-2.5 pl-2.5 pr-4 backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${accent.shell} ${
        t.visible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.97] opacity-0'
      }`}
      role={t.type === 'error' ? 'alert' : 'status'}
      aria-live={t.type === 'error' ? 'assertive' : 'polite'}
    >
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${accent.icon}`}>
        <ToastIcon type={t.type} />
      </span>

      <p className="min-w-0 truncate whitespace-nowrap text-[13px] font-medium tracking-[0.01em] text-body">
        {resolveValue(t.message, t)}
      </p>

      {showProgress ? (
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left ${accent.progress} motion-safe:animate-toast-progress`}
          style={{ animationDuration: `${duration}ms` }}
        />
      ) : null}
    </div>
  );
}

/** Drop-in replacement for <Toaster /> — no call-site changes needed. */
export default function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      gutter={10}
      containerStyle={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      toastOptions={{
        duration: 3500,
        style: { background: 'transparent', boxShadow: 'none', padding: 0, maxWidth: 'none' },
      }}
    >
      {(t) => <ToastBar t={t} />}
    </Toaster>
  );
}
