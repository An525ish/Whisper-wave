/**
 * Ads feature: public API. Slots go on quiet screens only (waiting, thread ended).
 * Never render `AdSlot` inside a live chat, rooms, or a settings/account page.
 */
export { default as AdSlot } from './components/AdSlot';
export { useAdConsent } from './hooks/useAdConsent';
