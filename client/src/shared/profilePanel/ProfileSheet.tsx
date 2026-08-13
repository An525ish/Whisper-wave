import ChevronLeft from '@/components/icons/ChevronLeft';
import ProfilePanel from '@/shared/profilePanel/ProfilePanel';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ProfileSheetProps = {
  open: boolean;
  onClose: () => void;
  /** When true, always show the signed-in user's editable profile. */
  forceSelf?: boolean;
  title?: string;
};

const ProfileSheet = ({
  open,
  onClose,
  forceSelf = false,
  title = 'Profile',
}: ProfileSheetProps) => {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex h-dvh w-full items-stretch justify-center p-0 lg:items-center lg:justify-end lg:p-4 lg:pr-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-sheet-title"
    >
      <button
        type="button"
        aria-label="Close profile"
        className={`absolute inset-0 hidden bg-black/55 backdrop-blur-[6px] transition-opacity duration-300 motion-reduce:transition-none lg:block ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative flex h-dvh min-h-0 w-full max-w-none flex-col overflow-hidden rounded-none border-0 bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-none transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none lg:h-[min(760px,calc(100dvh-1.5rem))] lg:max-w-[440px] lg:rounded-[1.75rem] lg:border lg:border-border/70 lg:bg-background/95 lg:pt-0 lg:pb-0 lg:shadow-[0_28px_80px_rgba(0,0,0,0.55)] lg:backdrop-blur-2xl ${
          entered
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-4 scale-[0.99] opacity-0 lg:translate-y-0 lg:translate-x-4 lg:scale-[0.98]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(1,195,109,0.14),transparent_70%)]" />

        <header className="relative shrink-0 px-3 pb-2 pt-3 sm:px-5">
          <div className="flex items-center gap-0.5 lg:gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center gap-0.5 rounded-lg px-1.5 text-body transition active:bg-primary/50 active:text-white lg:grid lg:h-10 lg:w-10 lg:place-items-center lg:rounded-full lg:border lg:border-border/80 lg:bg-background-alt/60 lg:px-0 lg:hover:border-green/40 lg:hover:bg-primary/80 lg:hover:text-white"
              aria-label="Close"
            >
              <ChevronLeft className="h-6 w-6 lg:h-5 lg:w-5" />
              <span className="pr-1 text-sm font-medium text-body-700 lg:hidden">
                Back
              </span>
            </button>
            <h2
              id="profile-sheet-title"
              className="min-w-0 flex-1 truncate text-center text-base font-semibold tracking-tight text-white lg:flex-none lg:text-left lg:text-lg"
            >
              {title}
            </h2>
            <span
              className="inline-block w-[4.25rem] shrink-0 lg:hidden"
              aria-hidden
            />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-hidden px-0 pb-0 lg:px-4 lg:pb-4">
          <ProfilePanel variant="sheet" forceSelf={forceSelf} />
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ProfileSheet;
