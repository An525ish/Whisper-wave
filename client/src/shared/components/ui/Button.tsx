import type { ButtonVariant } from '@/shared/types/ui';
import type { ButtonHTMLAttributes, ReactNode } from 'react';


type ButtonProps = {
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'rounded-3xl bg-gradient-action-button-green text-body px-4 py-2 outline-none',
  danger:
    'rounded-3xl bg-gradient-action-button-red text-body px-4 py-2 outline-none',
  outlineGreen:
    'rounded-2xl border-2 border-green-light text-green px-4 py-1 outline-none',
  outlineRed:
    'rounded-2xl border-2 border-red-light text-red px-4 py-1 outline-none',
  ghost:
    'rounded-lg bg-primary text-body-700 px-3 py-1.5 outline-none hover:text-body',
};

const Button = ({
  variant = 'primary',
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={`${variantClass[variant]} ${className}`.trim()}
    {...props}
  >
    {children}
  </button>
);

export default Button;
