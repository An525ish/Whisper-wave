import { useCallback, useEffect, useState } from 'react';

interface Params {
  selectMode: boolean;
}

export function useMessageSelection({ selectMode }: Params) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!selectMode) setSelectedIds(new Set());
  }, [selectMode]);

  const toggleSelected = useCallback((messageId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  }, []);

  return { selectedIds, setSelectedIds, toggleSelected };
}
