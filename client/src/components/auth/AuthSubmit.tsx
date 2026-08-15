import type { ButtonHTMLAttributes, ReactNode } from 'react';

type AuthSubmitProps = {
  children: ReactNode;
  pending?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

/** Primary auth CTA — matches chat green action gradient. */
const AuthSubmit = ({
  children,
  pending = false,
  className = '',
  disabled,
  type = 'submit',
  ...props
}: AuthSubmitProps) => (
  <button
    type={type}
    disabled={disabled || pending}
    className={`auth-submit flex h-11 w-full items-center justify-center rounded-xl bg-gradient-green text-sm font-semibold tracking-wide text-white shadow-[0_10px_28px_rgba(1,195,109,0.28)] transition enabled:active:scale-[0.985] enabled:hover:brightness-110 disabled:opacity-50 ${className}`.trim()}
    {...props}
  >
    {pending ? (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
    ) : (
      <span className="relative z-[1]">{children}</span>
    )}
  </button>
);

export default AuthSubmit;
