/**
 * Public entry point for the app-wide socket. Both the provider component and
 * the `useSocket` consumer hook are re-exported here so feature code keeps a
 * single import path. This module is a `.ts` barrel on purpose:
 * `react-refresh/only-export-components` only inspects `.jsx`/`.tsx`, so a
 * module that must export a component *and* a hook cannot live in a `.tsx`.
 */
export { SocketProvider } from './SocketProviderComponent';
export { useSocket } from './socketContext';
