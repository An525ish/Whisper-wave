import { useRef, type ReactNode } from 'react';
import { useDialogA11y } from '../hooks/useDialogA11y';

type Props = {
  open: boolean;
  onClose: () => void;
  /** id of the element that names the dialog. */
  labelledBy: string;
  rootClassName: string;
  backdropClassName: string;
  panelClassName: string;
  children: ReactNode;
};

/**
 * The feature's one accessible dialog shell (focus trap + restore, scroll lock,
 * Escape, aria-modal). The shared `BottomSheet` is a full-height drag sheet and the
 * shared `ConfirmationModal` is a two-button confirm, so neither fits the
 * mutual-vibe celebration or the report form — those supply their own look here.
 */
export default function WhisperDialog({
  open,
  onClose,
  labelledBy,
  rootClassName,
  backdropClassName,
  panelClassName,
  children,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onKeyDown = useDialogA11y(open, panelRef, onClose);

  if (!open) return null;

  return (
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
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    </div>
  );
}
