/**
 * Admin feature — public API. External code imports from `@/features/admin`;
 * internal files use relative imports.
 */
export { default as Sidebar } from './components/sidebar/Sidebar';
export { default as SidebarItem } from './components/sidebar/SidebarItem';
export { ADMIN_NAV_ITEMS } from './components/sidebar/adminNavItems';
export { useAdminLoginMutation, useAdminMeQuery } from './hooks';
