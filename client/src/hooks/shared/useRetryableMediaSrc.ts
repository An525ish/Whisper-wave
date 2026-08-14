import { useCallback, useEffect, useRef, useState } from 'react';
import { transformImage } from '@/utils/fileFormat';

export const MEDIA_FALLBACK_ICONS = {
  image: '/icons/picture-icon.svg',
  video: '/icons/video-icon.svg',
} as const;

export type RetryableMediaKind = keyof typeof MEDIA_FALLBACK_ICONS;

type UseRetryableMediaSrcOptions = {
  url: string;
  kind: RetryableMediaKind;
  transformWidth?: number;
  retryIntervalMs?: number;
  maxRetries?: number;
};

export function useRetryableMediaSrc({
  url,
  kind,
  transformWidth,
  retryIntervalMs = 4000,
  maxRetries = 10,
}: UseRetryableMediaSrcOptions) {
  const primarySrc = transformWidth ? transformImage(url, transformWidth) : url;

  const [src, setSrc] = useState(primarySrc);
  const [showFallback, setShowFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  const triedOriginalRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  const stopRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearInterval(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    retryCountRef.current = 0;
    setIsRetrying(false);
  }, []);

  const probeImage = useCallback((candidate: string, onSuccess: () => void) => {
    const probe = new Image();
    probe.onload = () => {
      if (mountedRef.current) onSuccess();
    };
    probe.onerror = () => {};
    probe.src = candidate;
  }, []);

  const probeVideo = useCallback((candidate: string, onSuccess: () => void) => {
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => {
      if (mountedRef.current) onSuccess();
    };
    probe.onerror = () => {};
    probe.src = candidate;
  }, []);

  const markReady = useCallback(
    (nextSrc: string) => {
      if (!mountedRef.current) return;
      setSrc(nextSrc);
      setShowFallback(false);
      setIsLoading(true);
      stopRetry();
    },
    [stopRetry],
  );

  const startBackgroundRetry = useCallback(() => {
    if (retryTimerRef.current || !url) return;

    setIsRetrying(true);
    retryTimerRef.current = setInterval(() => {
      retryCountRef.current += 1;
      if (retryCountRef.current > maxRetries) {
        stopRetry();
        return;
      }

      const candidate =
        retryCountRef.current % 2 === 0 ? url : primarySrc;
      const onSuccess = () => markReady(candidate);

      if (kind === 'video') {
        probeVideo(candidate, onSuccess);
      } else {
        probeImage(candidate, onSuccess);
      }
    }, retryIntervalMs);
  }, [
    url,
    primarySrc,
    maxRetries,
    retryIntervalMs,
    kind,
    markReady,
    probeImage,
    probeVideo,
    stopRetry,
  ]);

  const reset = useCallback(() => {
    stopRetry();
    triedOriginalRef.current = false;
    setSrc(primarySrc);
    setShowFallback(false);
    setIsLoading(true);
  }, [primarySrc, stopRetry]);

  useEffect(() => {
    mountedRef.current = true;
    reset();
    return () => {
      mountedRef.current = false;
      stopRetry();
    };
  }, [url, primarySrc, reset, stopRetry]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setShowFallback(false);
    stopRetry();
  }, [stopRetry]);

  const handleError = useCallback(() => {
    if (!triedOriginalRef.current && src !== url) {
      triedOriginalRef.current = true;
      setSrc(url);
      setIsLoading(true);
      return;
    }
    setIsLoading(false);
    setShowFallback(true);
    startBackgroundRetry();
  }, [src, url, startBackgroundRetry]);

  return {
    src,
    showFallback,
    isLoading,
    isRetrying,
    fallbackIcon: MEDIA_FALLBACK_ICONS[kind],
    handleLoad,
    handleError,
  };
}
