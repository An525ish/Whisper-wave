import { useId, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  length?: number;
};

const OTP_LENGTH = 6;

const OtpInput = ({
  value,
  onChange,
  onBlur,
  disabled = false,
  error,
  length = OTP_LENGTH,
}: OtpInputProps) => {
  const fieldId = useId();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? '');

  const focusAt = (index: number) => {
    const clamped = Math.max(0, Math.min(index, length - 1));
    inputRefs.current[clamped]?.focus();
    inputRefs.current[clamped]?.select();
  };

  const setDigits = (next: string[]) => {
    onChange(next.join('').slice(0, length));
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < length - 1) focusAt(index + 1);
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
        return;
      }
      if (index > 0) {
        event.preventDefault();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        focusAt(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusAt(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusAt(Math.min(pasted.length, length - 1));
  };

  return (
    <div className="auth-otp-field w-full text-center">
      <label
        htmlFor={`${fieldId}-0`}
        className="auth-otp-field__label"
      >
        Verification code
      </label>

      <div
        className="auth-otp"
        role="group"
        aria-label="6-digit verification code"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : undefined}
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            id={`${fieldId}-${index}`}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            aria-label={`Digit ${index + 1} of ${length}`}
            className={`auth-otp__cell ${
              error ? 'auth-otp__cell--error' : ''
            } ${digit ? 'auth-otp__cell--filled' : ''}`}
            onBlur={onBlur}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            onFocus={(event) => event.currentTarget.select()}
          />
        ))}
      </div>

      {error ? (
        <p id={`${fieldId}-error`} className="auth-otp-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default OtpInput;
