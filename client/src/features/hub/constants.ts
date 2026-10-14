/** Analytics event names for the hub (emitted via `shared/lib/analytics` `track`). */
export const HUB_EVENTS = {
  /** Hub home rendered. */
  VIEW: 'hub_view',
  /** A hub card was tapped. Carries `{ card }` — never PII. */
  CARD_CLICK: 'hub_card_click',
  /** A primary-nav destination was tapped. Carries `{ dest }` — never PII. */
  NAV_CLICK: 'nav_click',
} as const;
