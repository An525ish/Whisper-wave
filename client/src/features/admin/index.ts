/**
 * Admin feature — public API. External code imports from `@/features/admin`;
 * internal files use relative imports.
 */
export { default as Sidebar } from './components/sidebar/Sidebar';
export { default as SidebarItem } from './components/sidebar/SidebarItem';
export { ADMIN_NAV_ITEMS } from './components/sidebar/adminNavItems';
export { useAdminLoginMutation, useAdminMeQuery } from './hooks';

/**
 * Lazy route loaders for the admin section, shaped for react-router's `lazy`
 * option (each returns `{ Component }`). Exposed here so the app router can
 * code-split admin pages without deep-importing feature internals.
 */
export const adminRouteLoaders = {
  dashboard: () =>
    import('./components/dashboard/Dashboard').then((m) => ({ Component: m.default })),
  users: () =>
    import('./components/users/Users').then((m) => ({ Component: m.default })),
  messages: () =>
    import('./components/messages/Messages').then((m) => ({ Component: m.default })),
  groups: () =>
    import('./components/groups/Groups').then((m) => ({ Component: m.default })),
  activity: () =>
    import('./components/activity/Activity').then((m) => ({ Component: m.default })),
  media: () =>
    import('./components/attachments/Attachments').then((m) => ({ Component: m.default })),
  rooms: () =>
    import('./components/rooms/Rooms').then((m) => ({ Component: m.default })),
  reports: () =>
    import('./components/reports/Reports').then((m) => ({ Component: m.default })),
  audit: () =>
    import('./components/audit/Audit').then((m) => ({ Component: m.default })),
} as const;
