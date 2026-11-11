import EyeIcon from '@/shared/components/ui/icons/Eye';
import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';

type PasswordInputProps = {
  label: string;
  /** Shown below the field; also sets aria-invalid. */
  error?: string | null;
  /** auth = login/register chrome; panel = admin modals and slide-overs. */
  variant?: 'auth' | 'panel';
  /** Hide label visually but keep it for screen readers. */
  hideLabel?: boolean;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

const shellClass: Record<NonNullable<PasswordInputProps['variant']>, string> = {
  auth: 'h-11 w-full rounded-xl border bg-black-dark/80 px-3.5 pr-11 text-[15px] text-white outline-none placeholder:text-body-300/65 focus:border-green/55 focus:bg-black-dark focus:shadow-[0_0_0_3px_rgba(1,195,109,0.18)]',
  panel:
    'h-11 w-full rounded-xl border border-white/12 bg-white/5 px-3.5 pr-11 text-sm text-body outline-none placeholder:text-body-300/45 focus:border-green/45 focus:ring-2 focus:ring-green/20 disabled:opacity-50',
};

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  {
    label,
    error,
    variant = 'panel',
    hideLabel = false,
    id: idProp,
    className = '',
    disabled,
    ...rest
  },
  ref
) {
  const uid = useId();
  const inputId = idProp ?? uid;
  const errorId = `${inputId}-error`;
  const [showPassword, setShowPassword] = useState(false);

  const borderTone = error
    ? variant === 'auth'
      ? 'border-red/55 focus:border-red/60 focus:shadow-[0_0_0_3px_rgba(255,88,99,0.16)]'
      : 'border-red/40 focus:border-red/45 focus:ring-red/20'
    : variant === 'auth'
      ? 'border-white/10'
      : '';

  return (
    <div className="w-full text-left">
      <label
        htmlFor={inputId}
        className={
          hideLabel
            ? 'sr-only'
            : variant === 'auth'
              ? 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-body-700'
              : 'mb-1.5 block text-xs font-medium text-body-300'
        }
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={showPassword ? 'text' : 'password'}
          autoComplete="off"
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`${shellClass[variant]} ${borderTone} ${className}`.trim()}
          {...rest}
        />
        <button
          type="button"
          disabled={disabled}
          className="absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-body-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 disabled:opacity-40"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-pressed={showPassword}
          onClick={() => setShowPassword((prev) => !prev)}
        >
          <EyeIcon open={!showPassword} className="h-4 w-4" />
        </button>
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs text-red" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});

export default PasswordInput;
