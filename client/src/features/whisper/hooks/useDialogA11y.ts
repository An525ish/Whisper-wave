import { useEffect, type KeyboardEvent, type RefObject } from 'react';
import useEscapeKey from '@/shared/hooks/useEscapeKey';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Modal behaviour for a dialog panel: Escape closes, body scroll is locked, focus
 * moves in on open and is restored to the opener on close, and Tab stays inside.
 * Returns the `onKeyDown` that implements the trap.
 */
export function useDialogA11y(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void
) {
  useEscapeKey(onClose, open);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [open, panelRef]);

  return (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panel)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };
}
