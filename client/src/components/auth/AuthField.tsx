import EyeIcon from '@/components/ui/icons/Eye';
import { useState, type InputHTMLAttributes } from 'react';
import type {
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from 'react-hook-form';

type AuthFieldProps<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  type?: string;
  placeholder?: string;
  register: UseFormRegister<T>;
  validate?: RegisterOptions<T, Path<T>>['validate'];
  errors: FieldErrors<T>;
  autoComplete?: string;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'name' | 'type' | 'placeholder' | 'className' | 'autoComplete'
>;

const AuthField = <T extends FieldValues>({
  name,
  label,
  type = 'text',
  placeholder,
  register,
  validate,
  errors,
  autoComplete,
  ...rest
}: AuthFieldProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  const errorMessage = errors[name]?.message
    ? String(errors[name]?.message)
    : '';
  const fieldId = `auth-${String(name)}`;

  return (
    <div className="auth-field w-full text-left">
      <label
        htmlFor={fieldId}
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-body-700"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? `${fieldId}-error` : undefined}
          className={`h-11 w-full rounded-xl border bg-black-dark/80 px-3.5 text-[15px] text-white outline-none placeholder:text-body-300/65 focus:border-green/55 focus:bg-black-dark focus:shadow-[0_0_0_3px_rgba(1,195,109,0.18)] ${
            isPassword ? 'pr-11' : ''
          } ${
            errorMessage
              ? 'border-red/55 focus:border-red/60 focus:shadow-[0_0_0_3px_rgba(255,88,99,0.16)]'
              : 'border-white/10'
          }`}
          {...register(name, validate ? { validate } : undefined)}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            className="absolute top-1/2 right-1.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-body-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((prev) => !prev)}
          >
            <EyeIcon open={!showPassword} className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {errorMessage ? (
        <p
          id={`${fieldId}-error`}
          className="mt-1.5 text-xs text-red"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export default AuthField;
