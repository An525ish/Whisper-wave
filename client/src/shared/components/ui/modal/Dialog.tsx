import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import useEscapeKey from '@/shared/hooks/useEscapeKey';
import { useBodyScrollLock } from '@/shared/hooks/useBodyScrollLock';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';

type Props = {
  open: boolean;
  onClose: () => void;
  /** id of the element that names the dialog. */
  labelledBy: string;
  /** id of the element that describes the dialog (optional). */
  describedBy?: string;
  rootClassName?: string;
  backdropClassName?: string;
  panelClassName?: string;
  children: ReactNode;
};

const DEFAULT_ROOT = 'fixed inset-0 z-50 grid place-items-center p-6';
const DEFAULT_BACKDROP = 'absolute inset-0 bg-black/60 backdrop-blur-[6px]';
const DEFAULT_PANEL =
  'relative w-full max-w-xs rounded-3xl border border-white/10 bg-gradient-to-b from-[#2a2136] to-[#1a1520] p-6 text-center shadow-[0_28px_80px_rgba(0,0,0,0.55)]';

/**
 * The app's one accessible modal dialog: portal, backdrop click and Escape
 * close, page scroll lock, focus moves in and is restored on close, Tab stays
 * inside, `aria-modal` + `aria-labelledby`. Callers supply the content and may
 * override the look through the class props.
 */
const Dialog = ({
  open,
  onClose,
  labelledBy,
  describedBy,
  rootClassName = DEFAULT_ROOT,
  backdropClassName = DEFAULT_BACKDROP,
  panelClassName = DEFAULT_PANEL,
  children,
}: Props) => {
  const panelRef = useRef<HTMLDivElement>(null);
  useEscapeKey(onClose, open);
  useBodyScrollLock(open);
  useFocusTrap(open, panelRef);

  if (!open) return null;

  return createPortal(
    <div className={rootClassName} role="presentation">
      <button
        type="button"
        className={backdropClassName}
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={panelClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Dialog;
