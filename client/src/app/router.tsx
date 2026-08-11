import {
  createBrowserRouter,
  Navigate,
  Outlet,
  type RouteObject,
} from 'react-router-dom';
import { SocketProvider } from '@/socket/SocketProvider';
import { useAuthStore } from '@/stores/auth';
import { useAdminStore } from '@/stores/admin';
import type { ReactNode } from 'react';
import AdminWrapper from '@/layout/AdminWrapper';

function ProtectedRoutes({
  allow,
  redirect = '/auth',
  children,
}: {
  allow: boolean;
  redirect?: string;
  children?: ReactNode;
}) {
  if (!allow) return <Navigate to={redirect} replace />;
  return children ? <>{children}</> : <Outlet />;
}

function AuthedLayout() {
  const user = useAuthStore((s) => s.user);
  return (
    <SocketProvider>
      <ProtectedRoutes allow={Boolean(user)} />
    </SocketProvider>
  );
}

function GuestOnly() {
  const user = useAuthStore((s) => s.user);
  return <ProtectedRoutes allow={!user} redirect="/" />;
}

function AdminGuestOnly() {
  const isAdmin = useAdminStore((s) => s.isAdmin);
  return (
    <ProtectedRoutes allow={!isAdmin} redirect="/admin/dashboard" />
  );
}

function AdminAuthed() {
  const isAdmin = useAdminStore((s) => s.isAdmin);
  return (
    <ProtectedRoutes allow={isAdmin} redirect="/admin">
      <AdminWrapper />
    </ProtectedRoutes>
  );
}

export const router: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter([
    {
      path: '/admin',
      element: <AdminGuestOnly />,
      children: [
        {
          path: '',
          lazy: async () => {
            const module = await import('@/pages/admin/AdminAuth');
            return { Component: module.default };
          },
        },
      ],
    },
    {
      path: '/admin',
      element: <AdminAuthed />,
      children: [
        {
          path: 'dashboard',
          lazy: async () => {
            const module = await import('@/pages/admin/Dashboard');
            return { Component: module.default };
          },
        },
        {
          path: 'users',
          lazy: async () => {
            const module = await import('@/pages/admin/Users');
            return { Component: module.default };
          },
        },
        {
          path: 'messages',
          lazy: async () => {
            const module = await import('@/pages/admin/Messages');
            return { Component: module.default };
          },
        },
        {
          path: 'groups',
          lazy: async () => {
            const module = await import('@/pages/admin/Groups');
            return { Component: module.default };
          },
        },
      ],
    },
    {
      path: '/auth',
      element: <GuestOnly />,
      children: [
        {
          path: '',
          lazy: async () => {
            const module = await import('@/pages/Auth');
            return { Component: module.default };
          },
        },
      ],
    },
    {
      path: '/',
      element: <AuthedLayout />,
      children: [
        {
          path: '/',
          lazy: async () => {
            const module = await import('@/pages/Home');
            return { Component: module.default };
          },
        },
        {
          path: 'chat/:chatId',
          lazy: async () => {
            const module = await import('@/pages/Chat');
            return { Component: module.default };
          },
        },
      ],
    },
    {
      path: '*',
      lazy: async () => {
        const module = await import('@/pages/PageNotFound');
        return { Component: module.default };
      },
    },
  ] satisfies RouteObject[]);
