import { useEffect, useRef, type ReactNode } from 'react';

type ModalProps = {
  children: ReactNode;
  onClose: () => void;
};

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const Modal = ({ children, onClose }: ModalProps) => {
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll lock
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Escape to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      // Focus trap
      if (e.key === 'Tab' && innerRef.current) {
        const focusable = Array.from(
          innerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
        ).filter((el) => !el.hasAttribute('disabled'));
        if (!focusable.length) { e.preventDefault(); return; }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Auto-focus first focusable element
    const focusable = innerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusable?.[0]?.focus();

    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 shadow-white backdrop-blur"
      onClick={onClose}
    >
      <div
        ref={innerRef}
        className="relative z-30 rounded-2xl py-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 -top-2 cursor-pointer font-medium text-lg"
          onClick={onClose}
          aria-label="Close"
        >
          Close
        </button>

        {children}
      </div>
    </div>
  );
};

export default Modal;
