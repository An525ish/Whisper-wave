/**
 * Lightweight, provider-agnostic funnel analytics.
 *
 * Domain-agnostic transport only: each feature owns its event names (e.g.
 * `WHISPER_EVENTS` in features/whisper/constants.ts) and calls `track`.
 *
 * Deliberate choices:
 *  - No PII. Events carry counts, booleans and short enum-ish labels only. We
 *    never send an alias, a message body, or an anonId off the device.
 *  - A no-op when `VITE_ANALYTICS_ENDPOINT` is unset, so local dev and forks
 *    cost nothing and can't leak.
 *  - Failures are swallowed. Analytics must never break the product.
 *  - Uses `sendBeacon` (not the API client) on purpose: the target is a foreign
 *    origin, so our cookies must not be sent, and events must survive unload.
 *    This is the one sanctioned exception to the single-HTTP-client rule.
 *
 * Cost: self-hosted or free-tier collector only. See docs/TECH.md.
 */

/** Values safe to send: no PII, no unbounded strings. */
type AnalyticsProps = Record<string, string | number | boolean | undefined>;

const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;

const post = (event: string, props: AnalyticsProps): void => {
  if (!endpoint) return;
  try {
    const body = JSON.stringify({ event, props, at: Date.now() });
    // sendBeacon survives page unload, which matters for end-of-session events.
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body);
      return;
    }
    void fetch(endpoint, {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => undefined);
  } catch {
    // Never let analytics break the app.
  }
};

export const track = (event: string, props: AnalyticsProps = {}): void =>
  post(event, props);
