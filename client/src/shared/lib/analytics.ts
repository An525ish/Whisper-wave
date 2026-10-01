/**
 * Lightweight, provider-agnostic funnel analytics.
 *
 * PHASE2.md defines the launch metrics (like rate, mutual rate, connect rate,
 * median session length, report rate, re-Whisper rate). None of them are
 * measurable without emitting these events, so Phase 2 ships them.
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

export const ANALYTICS = {
  /** User submitted the vibe picker. */
  WHISPER_JOIN: 'whisper_join',
  /** Server confirmed a match. */
  WHISPER_MATCHED: 'whisper_matched',
  /** Outgoing message sent. */
  WHISPER_MESSAGE_SENT: 'whisper_message_sent',
  /** User tapped the like/vibe button. */
  WHISPER_LIKE_SENT: 'whisper_like_sent',
  /** Mutual like achieved — the top of the funnel. */
  WHISPER_MUTUAL: 'whisper_mutual',
  /** Both sides revealed — a real DM now exists. */
  WHISPER_DM_OPENED: 'whisper_dm_opened',
  /** User skipped to the next match. */
  WHISPER_NEXT: 'whisper_next',
  /** Partner ended the session. */
  WHISPER_PARTNER_LEFT: 'whisper_partner_left',
  /** Abuse report filed. */
  WHISPER_REPORT: 'whisper_report',
  /** Match ended — carries durationMs and messageCount. */
  WHISPER_SESSION_END: 'whisper_session_end',
} as const;

export type AnalyticsEvent = (typeof ANALYTICS)[keyof typeof ANALYTICS];

/** Values safe to send: no PII, no unbounded strings. */
export type AnalyticsProps = Record<
  string,
  string | number | boolean | undefined
>;

const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;

const post = (event: AnalyticsEvent, props: AnalyticsProps): void => {
  if (!endpoint) return;
  try {
    const body = JSON.stringify({ event, props, at: Date.now() });
    // sendBeacon survives page unload, which matters for WHISPER_SESSION_END.
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

export const track = (event: AnalyticsEvent, props: AnalyticsProps = {}): void =>
  post(event, props);
