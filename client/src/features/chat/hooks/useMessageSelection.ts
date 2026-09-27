import { useCallback, useEffect, useState } from 'react';

interface Params {
  selectMode: boolean;
  onExitSelectMode?: () => void;
}

export function useMessageSelection({ selectMode, onExitSelectMode }: Params) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selectMode) setSelectedIds(new Set());
  }, [selectMode]);

  const toggleSelected = useCallback((messageId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      // exit select mode when the last item is deselected
      if (next.size === 0) onExitSelectMode?.();
      return next;
    });
  }, [onExitSelectMode]);

  return { selectedIds, setSelectedIds, toggleSelected };
}
