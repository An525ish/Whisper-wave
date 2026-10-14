import { useEffect, type RefObject } from 'react';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const focusablesIn = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute('aria-hidden') && el.getClientRects().length > 0
  );

/**
 * Modal focus management: moves focus into `root` (to `initialRef`, else the
 * root itself so no mobile keyboard pops) when `active` turns on, keeps Tab /
 * Shift+Tab inside it, and restores focus to whatever held it before.
 * The root needs `tabIndex={-1}` to be focusable.
 */
export function useFocusTrap(
  active: boolean,
  rootRef: RefObject<HTMLElement | null>,
  initialRef?: RefObject<HTMLElement | null>
): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!active || !root) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (!root.contains(document.activeElement)) {
      const target = initialRef?.current ?? root;
      target.focus({ preventScroll: true });
    }

    const onKeyDown = (e: KeyboardEvent) => {
      // Focus living in another overlay (a confirm dialog opened from here) is not ours to steal.
      if (e.key !== 'Tab' || !root.contains(document.activeElement)) return;
      const items = focusablesIn(root);
      if (items.length === 0) {
        e.preventDefault();
        root.focus({ preventScroll: true });
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previous && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, [active, rootRef, initialRef]);
}
