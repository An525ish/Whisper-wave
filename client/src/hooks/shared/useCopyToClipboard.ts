import { useCallback, useState, type MouseEvent } from 'react';

const RESET_MS = 1500;

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback((text: string, event?: MouseEvent<HTMLElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), RESET_MS);
    });
  }, []);

  return { copied, copy };
}
