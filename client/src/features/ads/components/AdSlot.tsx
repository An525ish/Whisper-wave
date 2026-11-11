import { useEffect, useRef, useState } from 'react';
import { loadAdsense } from '../api/adsenseScript';
import { useAdConsent } from '../hooks/useAdConsent';
import { useAdsConfig } from '../hooks/useAdsConfig';
import type { AdPlacement } from '../types';
import './adSlot.css';

function AdUnit({ client, slot }: { client: string; slot: string }) {
  const ref = useRef<HTMLModElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    loadAdsense(client)
      .then(() => {
        const el = ref.current;
        // StrictMode runs effects twice; AdSense throws if one <ins> is pushed twice.
        if (!live || !el || el.dataset.adsbygoogleStatus) return;
        (window.adsbygoogle ??= []).push({});
      })
      .catch(() => live && setFailed(true)); // ad blocker or network: just no ad
    return () => {
      live = false;
    };
  }, [client]);

  if (failed) return null;
  return (
    <ins
      ref={ref}
      className="adsbygoogle ad-slot__unit"
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}

/**
 * One ad, for the quiet moments only: the waiting screen and the thread-ended
 * screen. Never put this inside a live chat. Renders nothing when ads are off,
 * the visitor holds a Spark Pass, they said no, or the ad is blocked/unfilled.
 */
export default function AdSlot({ placement }: { placement: AdPlacement }) {
  const { data } = useAdsConfig();
  const choice = useAdConsent((s) => s.choice);
  const setChoice = useAdConsent((s) => s.set);

  const slot = data?.enabled ? data.slots[placement] : null;
  if (!data?.client || !slot || choice === 'declined') return null;

  return (
    <aside className="ad-slot" aria-label="Advertisement">
      {choice === 'granted' ? (
        <>
          <p className="ad-slot__label">Ad</p>
          <AdUnit client={data.client} slot={slot} />
        </>
      ) : (
        <div className="ad-slot__ask">
          <p>Ads keep Whisper free. They aren&apos;t based on you or your chats. Show them?</p>
          <div className="ad-slot__actions">
            <button type="button" onClick={() => setChoice('granted')}>
              Show ads
            </button>
            <button type="button" onClick={() => setChoice('declined')}>
              No thanks
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
