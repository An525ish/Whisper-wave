import { useCallback, useEffect, type KeyboardEvent, type RefObject } from 'react';
import useEscapeKey from './useEscapeKey';

const ITEM_SELECTOR = '[role="menuitem"]:not([disabled])';

interface Params {
  open: boolean;
  /** The element holding the `role="menuitem"` buttons. */
  menuRef: RefObject<HTMLElement | null>;
  /** Focus returns here when the menu closes by keyboard. */
  triggerRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}

/**
 * Keyboard behaviour for a menu button's popup: focus lands on the first item
 * when it opens; Arrow Up/Down (wrapping), Home and End move between items;
 * Escape or Tab closes it and Escape hands focus back to the trigger.
 * Returns the `onKeyDown` for the menu element.
 */
export function useMenuKeyboard({ open, menuRef, triggerRef, onClose }: Params) {
  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus();
  }, [open, menuRef]);

  const closeToTrigger = useCallback(() => {
    onClose();
    triggerRef.current?.focus();
  }, [onClose, triggerRef]);

  useEscapeKey(closeToTrigger, open);

  return (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Tab') {
      onClose();
      return;
    }
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    let next: number | null = null;
    if (event.key === 'ArrowDown') next = (current + 1) % items.length;
    else if (event.key === 'ArrowUp') next = (current <= 0 ? items.length : current) - 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    if (next === null) return;
    event.preventDefault();
    items[next].focus();
  };
}
