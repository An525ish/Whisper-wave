import {
  createBrowserRouter,
  Navigate,
  Outlet,
  type RouteObject,
} from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { SocketProvider } from '@/socket/SocketProvider';
import { useAuthStore } from '@/stores/auth';
import { useAdminStore } from '@/stores/admin';
import AdminWrapper from '@/layout/AdminWrapper';
import AppLoader from '@/components/ui/loader/AppLoader';
import { useAdminMeQuery } from '@/hooks/admin';
import RouteError from '@/app/RouteError';

const Landing = lazy(() => import('@/pages/Landing'));
const Home = lazy(() => import('@/pages/Home'));

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

/** Guests see the landing page. Signed-in users see the chat home. */
function RootIndex() {
  const user = useAuthStore((s) => s.user);
  return (
    <Suspense fallback={<AppLoader />}>
      {user ? (
        <SocketProvider>
          <Home />
        </SocketProvider>
      ) : (
        <Landing />
      )}
    </Suspense>
  );
}

/** Probe admin cookie only under /admin — not on every app boot. */
function AdminBootstrap() {
  const { isLoading } = useAdminMeQuery();
  if (isLoading) return <AppLoader />;
  return <Outlet />;
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

const appRoutes = [
  {
    path: '/landing',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/admin',
    element: <AdminBootstrap />,
    children: [
      {
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
        element: <AdminAuthed />,
        children: [
          {
            path: 'dashboard',
            lazy: async () => {
              const module = await import('@/components/admin/dashboard/Dashboard');
              return { Component: module.default };
            },
          },
          {
            path: 'users',
            lazy: async () => {
              const module = await import('@/components/admin/users/Users');
              return { Component: module.default };
            },
          },
          {
            path: 'messages',
            lazy: async () => {
              const module = await import('@/components/admin/messages/Messages');
              return { Component: module.default };
            },
          },
          {
            path: 'groups',
            lazy: async () => {
              const module = await import('@/components/admin/groups/Groups');
              return { Component: module.default };
            },
          },
          {
            path: 'activity',
            lazy: async () => {
              const module = await import('@/components/admin/activity/Activity');
              return { Component: module.default };
            },
          },
          {
            path: 'media',
            lazy: async () => {
              const module = await import('@/components/admin/attachments/Attachments');
              return { Component: module.default };
            },
          },
        ],
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
      {
        path: 'reset-password',
        lazy: async () => {
          const module = await import('@/pages/ResetPassword');
          return { Component: module.default };
        },
      },
    ],
  },
  {
    path: '/',
    children: [
      {
        index: true,
        element: <RootIndex />,
      },
      {
        element: <AuthedLayout />,
        children: [
          {
            path: 'chat/:chatId',
            lazy: async () => {
              const module = await import('@/pages/Chat');
              return { Component: module.default };
            },
          },
        ],
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
] satisfies RouteObject[];

export const router: ReturnType<typeof createBrowserRouter> =
  createBrowserRouter([
    {
      errorElement: <RouteError />,
      children: appRoutes,
    },
  ]);
