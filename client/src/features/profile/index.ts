/**
 * Profile feature — public API. External code imports from `@/features/profile`;
 * internal files use relative imports.
 */
export { default as AccountBar } from './components/AccountBar';
export { default as ProfileHeader } from './components/ProfileHeader';
export { default as ProfilePanel } from './components/ProfilePanel';
export { default as ProfileSheet } from './components/ProfileSheet';
export { useProfileUiStore } from './store';
