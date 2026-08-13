import type {
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from 'react-hook-form';
import type { InputHTMLAttributes } from 'react';

type InputFieldProps<T extends FieldValues> = {
  name: Path<T>;
  type?: string;
  placeholder?: string;
  className?: string;
  register: UseFormRegister<T>;
  validate?: RegisterOptions<T, Path<T>>['validate'];
  errors: FieldErrors<T>;
} & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'name' | 'type' | 'placeholder' | 'className'
>;

const InputField = <T extends FieldValues>({
  name,
  type = 'text',
  placeholder,
  className = '',
  register,
  validate,
  errors,
  ...rest
}: InputFieldProps<T>) => {
  return (
    <>
      <input
        type={type}
        placeholder={placeholder}
        className={`px-4 py-2 border border-border rounded-3xl bg-primary w-full outline-none ${className}`}
        {...register(name, validate ? { validate } : undefined)}
        {...rest}
      />

      {errors[name] && (
        <p className="text-red text-left text-2xs">
          {String(errors[name]?.message ?? '')}
        </p>
      )}
    </>
  );
};

export default InputField;
