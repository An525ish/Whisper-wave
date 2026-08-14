import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy: string;
  closeLabel?: string;
  /** lg+ becomes a right-side card instead of a bottom sheet. */
  sideCardOnDesktop?: boolean;
};

const BottomSheet = ({
  open,
  onClose,
  children,
  labelledBy,
  closeLabel = 'Close',
  sideCardOnDesktop = false,
}: BottomSheetProps) => {
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
      className={`fixed inset-0 z-50 flex h-dvh w-full items-end justify-center p-0 ${
        sideCardOnDesktop
          ? 'lg:items-center lg:justify-end lg:p-4 lg:pr-8'
          : ''
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <button
        type="button"
        aria-label={closeLabel}
        className={`absolute inset-0 bg-black/55 backdrop-blur-[6px] transition-opacity duration-300 motion-reduce:transition-none ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative flex h-[90dvh] min-h-0 w-full max-w-none flex-col overflow-hidden rounded-t-[1.75rem] border border-b-0 border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-16px_48px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          sideCardOnDesktop
            ? 'lg:h-[min(760px,calc(100dvh-1.5rem))] lg:max-w-110 lg:rounded-[1.75rem] lg:border-b lg:pb-0 lg:shadow-[0_28px_80px_rgba(0,0,0,0.55)] lg:transition-all'
            : ''
        } ${
          entered
            ? `translate-y-0 opacity-100 ${sideCardOnDesktop ? 'lg:scale-100' : ''}`
            : `translate-y-full opacity-0 ${
                sideCardOnDesktop
                  ? 'lg:translate-y-0 lg:translate-x-4 lg:scale-[0.98]'
                  : ''
              }`
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(1,195,109,0.14),transparent_70%)]" />
        <div
          className={`mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-border/80 ${
            sideCardOnDesktop ? 'lg:hidden' : ''
          }`}
        />
        {children}
      </div>
    </div>,
    document.body,
  );
};

export default BottomSheet;
