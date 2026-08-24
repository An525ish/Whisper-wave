import type { UsernameAvailabilityStatus } from '@/hooks/auth/useUsernameAvailability';

type UsernameStatusBadgeProps = { status: UsernameAvailabilityStatus };

const UsernameStatusBadge = ({ status }: UsernameStatusBadgeProps) => {
  if (status === 'idle') return null;

  if (status === 'checking') {
    return (
      <span className="mt-1.5 flex items-center gap-1.5 text-xs text-body-300/70">
        <span
          className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-body-300/30 border-t-body-300"
          aria-hidden
        />
        Checking…
      </span>
    );
  }

  if (status === 'available') {
    return (
      <span className="mt-1.5 flex items-center gap-1.5 text-xs text-green" role="status">
        <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0 fill-none stroke-green stroke-[1.8]" aria-hidden>
          <polyline points="2,6.5 5,9.5 10,3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Username is available
      </span>
    );
  }

  if (status === 'taken') {
    return (
      <span className="mt-1.5 flex items-center gap-1.5 text-xs text-red" role="alert">
        <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0 fill-none stroke-red stroke-[1.8]" aria-hidden>
          <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" strokeLinecap="round" />
          <line x1="9.5" y1="2.5" x2="2.5" y2="9.5" strokeLinecap="round" />
        </svg>
        Username already taken
      </span>
    );
  }

  // error state
  return (
    <span className="mt-1.5 flex items-center gap-1.5 text-xs text-body-300/60">
      Couldn't check — try a different name
    </span>
  );
};

export default UsernameStatusBadge;
