/**
 * Pass feature (Spark Pass) — public API. Pages and other features import from
 * `@/features/pass`; internal files use relative imports.
 */
export { default as PassCheckout } from './components/PassCheckout';
export { default as BoostButton } from './components/BoostButton';
export { default as PricingPage } from './components/PricingPage';
export { useEntitlementsQuery, useHasPass } from './hooks/usePassQueries';
export { passKeys } from './hooks/queryKeys';
export type { Entitlements, PlanId } from './types';
