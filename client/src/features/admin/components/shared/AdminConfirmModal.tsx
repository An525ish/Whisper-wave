import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import TrashIcon from '@/shared/components/ui/icons/Trash';
import LeaveGroupIcon from '@/shared/components/ui/icons/LeaveGroup';
import PasswordInput from '@/shared/components/ui/PasswordInput';
import { toErrorMessage } from '@/shared/utils/helpers';
import type { ConfirmationVariant } from '@/shared/types/ui';
import * as adminApi from '../../api/admin';

export type AdminConfirmModalProps = {
  onClose: () => void;
  /** Runs after the action key passes server verification. */
  onConfirmed: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationVariant;
  icon?: ReactNode;
  /** Parent mutation still running after key check. */
  working?: boolean;
};

/**
 * Double confirmation for risky admin work: explain the action, then require
 * ADMIN_ACTION_KEY (server env, separate from admin login). Reuse in the panel.
 */
export default function AdminConfirmModal({
  onClose,
  onConfirmed,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon,
  working = false,
}: AdminConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [entered, setEntered] = useState(false);
  const [actionKey, setActionKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const isDanger = variant === 'danger';
  const tone = {
    danger: {
      glow: 'bg-[radial-gradient(ellipse_at_top,rgba(255,88,99,0.18),transparent_70%)]',
      badge: 'border-red/30 bg-red/12 text-red',
      confirm: 'bg-red hover:bg-red/90',
    },
    warning: {
      glow: 'bg-[radial-gradient(ellipse_at_top,rgba(255,153,51,0.18),transparent_70%)]',
      badge: 'border-orange/30 bg-orange/12 text-orange',
      confirm: 'bg-orange hover:bg-orange/90 text-black',
    },
    default: {
      glow: 'bg-[radial-gradient(ellipse_at_top,rgba(1,195,109,0.16),transparent_70%)]',
      badge: 'border-green/30 bg-green/12 text-green',
      confirm: 'bg-green hover:bg-green/90 text-black',
    },
  }[variant];

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !checking && !working) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    inputRef.current?.focus();
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [checking, onClose, working]);

  const busy = checking || working;
  const canSubmit = actionKey.trim().length > 0 && !busy;

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setChecking(true);
    try {
      await adminApi.verifyAdminActionKey(actionKey.trim());
      await onConfirmed();
      onClose();
    } catch (err) {
      setError(toErrorMessage(err, 'Invalid action key'));
    } finally {
      setChecking(false);
    }
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
        disabled={busy}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
          entered ? 'opacity-100' : 'opacity-0'
        } ${busy ? 'cursor-wait' : ''}`}
        onClick={() => {
          if (!busy) onClose();
        }}
      />

      <form
        onSubmit={(e) => void submit(e)}
        className={`relative w-[min(100%,22.5rem)] overflow-hidden rounded-3xl border border-white/10 bg-background-alt/95 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:p-6 ${
          entered
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-3 scale-[0.98] opacity-0'
        }`}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 ${tone.glow}`} />

        <div
          className={`relative mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border ${tone.badge}`}
        >
          {icon ??
            (isDanger ? (
              <TrashIcon className="h-6 w-6" />
            ) : (
              <LeaveGroupIcon className="h-6 w-6 fill-current stroke-current" />
            ))}
        </div>

        <h2 id={titleId} className="relative text-center text-lg font-semibold leading-snug text-white">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="relative mt-2 text-center text-sm leading-relaxed text-body-700">
            {description}
          </p>
        ) : null}

        <div className="relative mt-5">
          <PasswordInput
            ref={inputRef}
            label="Action key"
            variant="panel"
            placeholder="Your admin action key"
            value={actionKey}
            disabled={busy}
            error={error}
            onChange={(e) => {
              setActionKey(e.target.value);
              if (error) setError(null);
            }}
          />
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="h-11 rounded-xl border border-white/12 bg-white/5 text-sm font-medium text-body transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={`h-11 rounded-xl text-sm font-semibold text-white-pure shadow-md transition disabled:cursor-not-allowed disabled:opacity-45 ${tone.confirm}`}
          >
            {checking ? 'Checking…' : working ? 'Working…' : confirmLabel}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
