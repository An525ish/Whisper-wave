import PasswordInput from '@/shared/components/ui/PasswordInput';
import type {
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from 'react-hook-form';
import type { InputHTMLAttributes } from 'react';

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
  const isPassword = type === 'password';
  const errorMessage = errors[name]?.message ? String(errors[name]?.message) : '';
  const fieldId = `auth-${String(name)}`;
  const reg = register(name, validate ? { validate } : undefined);

  if (isPassword) {
    return (
      <div className="auth-field w-full text-left">
        <PasswordInput
          id={fieldId}
          label={label}
          variant="auth"
          placeholder={placeholder}
          autoComplete={autoComplete}
          error={errorMessage || null}
          {...reg}
          {...rest}
        />
      </div>
    );
  }

  return (
    <div className="auth-field w-full text-left">
      <label
        htmlFor={fieldId}
        className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-body-700"
      >
        {label}
      </label>
      <input
        id={fieldId}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={errorMessage ? `${fieldId}-error` : undefined}
        className={`h-11 w-full rounded-xl border bg-black-dark/80 px-3.5 text-[15px] text-white outline-none placeholder:text-body-300/65 focus:border-green/55 focus:bg-black-dark focus:shadow-[0_0_0_3px_rgba(1,195,109,0.18)] ${
          errorMessage
            ? 'border-red/55 focus:border-red/60 focus:shadow-[0_0_0_3px_rgba(255,88,99,0.16)]'
            : 'border-white/10'
        }`}
        {...reg}
        {...rest}
      />
      {errorMessage ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-xs text-red" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export default AuthField;
