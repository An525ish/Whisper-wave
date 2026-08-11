import type { ReactNode } from 'react';

type DialogWrapperProps = {
  children: ReactNode;
  isOpen: boolean;
};

const DialogWrapper = ({ children, isOpen }: DialogWrapperProps) => {
  return (
    <div
      className={`absolute inset-0 z-40 overflow-hidden rounded-xl border border-border backdrop-blur-2xl backdrop-brightness-[0.85] transition-opacity ${
        isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      {children}
    </div>
  );
};

export default DialogWrapper;
