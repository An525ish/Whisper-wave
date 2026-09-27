import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import useEscapeKey from '@/shared/hooks/useEscapeKey';
import { DETAIL_PANEL_TRANSITION_MS } from '@/shared/constants/app';

const panelMotion = (open: boolean) =>
  [
    'transform transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none motion-reduce:transform-none',
    open ? 'translate-x-0' : 'translate-x-full',
  ].join(' ');

const backdropMotion = (open: boolean) =>
  [
    'transition-opacity duration-300 ease-out motion-reduce:transition-none',
    open ? 'opacity-100' : 'opacity-0',
  ].join(' ');

type SlideOverPanelProps = {
  /** Called after the exit animation finishes to unmount the panel. */
  onClose: () => void;
  /** id of the heading element inside `children`, for `aria-labelledby`. */
  labelledById: string;
  /** Extra classes appended to the `<aside>` shell. */
  className?: string;
  /**
   * Panel content. Receives the animated `close` handler so headers/footers
   * can dismiss the panel with the same enter/exit transition.
   */
  children: (close: () => void) => ReactNode;
};

/**
 * Right-side slide-over drawer: a portal with an animated backdrop and a
 * `role="dialog"` aside that slides in from the right. Owns the enter/exit
 * transition lifecycle (exit runs before `onClose` fires, after
 * DETAIL_PANEL_TRANSITION_MS) and Escape-to-close. Extracted from the admin
 * user/group detail panels so the scaffold lives in exactly one place.
 */
const SlideOverPanel = ({
  onClose,
  labelledById,
  className = '',
  children,
}: SlideOverPanelProps) => {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(true));
    return () => {
      cancelAnimationFrame(frame);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const requestClose = useCallback(() => {
    setOpen(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(onClose, DETAIL_PANEL_TRANSITION_MS);
  }, [onClose]);

  useEscapeKey(requestClose);

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-stretch justify-end">
      <button
        type="button"
        className={`absolute inset-0 bg-black/55 backdrop-blur-sm ${backdropMotion(open)}`}
        aria-label="Close"
        onClick={requestClose}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        className={`relative z-10 flex h-full w-full max-w-104 flex-col border-l border-border/50 bg-background/95 shadow-2xl backdrop-blur-xl ${panelMotion(open)} ${className}`}
      >
        {children(requestClose)}
      </aside>
    </div>,
    document.body,
  );
};

export default SlideOverPanel;
