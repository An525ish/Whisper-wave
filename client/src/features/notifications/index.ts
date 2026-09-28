/**
 * Notifications feature — public API. External code imports from
 * `@/features/notifications`; internal files use relative imports.
 */
export { default as NotificationDialog } from './components/NotificationDialog';
export { default as Title } from './components/Title';
export { useNotificationsStore, selectTotalNotificationCount } from './store';
