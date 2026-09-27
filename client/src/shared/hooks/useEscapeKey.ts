import { useEffect } from 'react';

/**
 * Invokes `onClose` when the Escape key is pressed. Attaches a single window
 * keydown listener while `enabled` (default true). Consolidates the
 * escape-to-dismiss effect that overlays would otherwise each reimplement.
 */
export default function useEscapeKey(onClose: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, enabled]);
}
