import { useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Centralizes the fetch → object-URL → anchor-click → deferred-revoke download
 * dance (and its failure toast) so call sites don't reimplement it. The revoke
 * is deferred to the next tick because revoking synchronously after `click()`
 * cancels the download in Firefox.
 *
 * Side effects (network + toast) live here in a hook rather than a pure util,
 * per the architecture rules.
 */
export default function useFileDownload() {
  const downloadFile = useCallback(
    async (url: string, fileName?: string | null): Promise<void> => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName || 'download';
        link.click();
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 0);
      } catch {
        toast.error('Download Failed');
      }
    },
    [],
  );

  return { downloadFile };
}
