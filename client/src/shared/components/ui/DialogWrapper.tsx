import type { ReactNode } from 'react';

type DialogWrapperProps = {
  children: ReactNode;
  isOpen: boolean;
  className?: string;
};

const DialogWrapper = ({
  children,
  isOpen,
  className = 'rounded-xl',
}: DialogWrapperProps) => {
  return (
    <div
      className={`absolute inset-0 z-40 overflow-hidden border border-border bg-background/95 backdrop-blur-2xl backdrop-brightness-[0.9] transition-opacity ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default DialogWrapper;
