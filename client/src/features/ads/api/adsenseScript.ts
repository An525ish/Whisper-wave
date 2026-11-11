declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>> & { requestNonPersonalizedAds?: number };
  }
}

let loading: Promise<void> | null = null;

/**
 * Load the AdSense script on demand, once, and only after the person said yes.
 * Always asks for non-personalised ads: nothing about you or your chats shapes
 * what is shown. A blocked or failed load rejects so the slot can quietly vanish.
 */
export const loadAdsense = (client: string): Promise<void> => {
  window.adsbygoogle = window.adsbygoogle ?? [];
  window.adsbygoogle.requestNonPersonalizedAds = 1;
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error('Ads did not load'));
    };
    document.head.appendChild(script);
  });
  return loading;
};
