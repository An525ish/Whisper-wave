import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import LeaveGroupIcon from '@/components/ui/icons/LeaveGroup';
import TrashIcon from '@/components/ui/icons/Trash';
import type { ConfirmationResult, ConfirmationVariant } from '@/types/ui';

type ConfirmationModalProps = {
  onClose: () => void;
  handleConfirmationModal: (result: ConfirmationResult) => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationVariant;
  icon?: ReactNode;
};

const ConfirmationModal = ({
  onClose,
  handleConfirmationModal,
  title = 'Are you sure you want to leave?',
  description,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  variant = 'danger',
  icon,
}: ConfirmationModalProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const [entered, setEntered] = useState(false);
  const isDanger = variant === 'danger';

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const resolve = (accept: boolean) => {
    handleConfirmationModal({ accept });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-80 flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <button
        type="button"
        aria-label="Dismiss"
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
          entered ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        className={`relative w-[min(100%,22.5rem)] overflow-hidden rounded-3xl border border-white/10 bg-background-alt/95 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:p-6 ${
          entered
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-3 scale-[0.98] opacity-0'
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-28 ${
            isDanger
              ? 'bg-[radial-gradient(ellipse_at_top,rgba(255,88,99,0.18),transparent_70%)]'
              : 'bg-[radial-gradient(ellipse_at_top,rgba(1,195,109,0.16),transparent_70%)]'
          }`}
        />

        <div
          className={`relative mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border ${
            isDanger
              ? 'border-red/30 bg-red/12 text-red'
              : 'border-green/30 bg-green/12 text-green'
          }`}
        >
          {icon ??
            (isDanger ? (
              <TrashIcon className="h-6 w-6" />
            ) : (
              <LeaveGroupIcon className="h-6 w-6 fill-current stroke-current" />
            ))}
        </div>

        <h2
          id={titleId}
          className="relative text-center text-lg font-semibold leading-snug text-white"
        >
          {title}
        </h2>
        {description ? (
          <p
            id={descriptionId}
            className="relative mt-2 text-center text-sm leading-relaxed text-body-700"
          >
            {description}
          </p>
        ) : null}

        <div className="relative mt-6 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => resolve(false)}
            className="h-11 rounded-xl border border-white/12 bg-white/5 text-sm font-medium text-body transition hover:bg-white/10 hover:text-white hover:filter-none active:filter-none"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => resolve(true)}
            className={`h-11 rounded-xl text-sm font-semibold text-white-pure shadow-md transition hover:filter-none active:filter-none ${
              isDanger
                ? 'bg-red hover:bg-red/90'
                : 'bg-green hover:bg-green/90 text-black'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmationModal;
