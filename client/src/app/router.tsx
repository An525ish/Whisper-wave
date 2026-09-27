import {
  createBrowserRouter,
  Navigate,
  Outlet,
  type RouteObject,
} from 'react-router-dom';
import { lazy, Suspense, type ReactNode } from 'react';
import { SocketProvider } from '@/shared/lib/socket/SocketProvider';
import { useAuthStore } from '@/features/auth';
import AdminWrapper from '@/layout/AdminWrapper';
import AppLoader from '@/shared/components/ui/loader/AppLoader';
import { useAdminMeQuery, adminRouteLoaders } from '@/features/admin';
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
  // Guard before mounting SocketProvider so an unauthenticated visitor never
  // opens a socket connection for the render cycle before redirecting.
  if (!user) return <Navigate to="/auth" replace />;
  return (
    <SocketProvider>
      <Outlet />
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
  // Read from query cache — already resolved by the time AdminBootstrap hands off.
  // Avoids the one-render gap between query settling and the useEffect syncing Zustand.
  const { data } = useAdminMeQuery();
  const isAdmin = data?.isAdmin ?? false;
  return (
    <ProtectedRoutes allow={!isAdmin} redirect="/admin/dashboard" />
  );
}

function AdminAuthed() {
  const { data } = useAdminMeQuery();
  const isAdmin = data?.isAdmin ?? false;
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
    path: '/spark-pass',
    lazy: async () => {
      const module = await import('@/pages/SparkPass');
      return { Component: module.default };
    },
  },
  {
    path: '/terms',
    lazy: async () => {
      const module = await import('@/pages/legal/Terms');
      return { Component: module.default };
    },
  },
  {
    path: '/privacy',
    lazy: async () => {
      const module = await import('@/pages/legal/Privacy');
      return { Component: module.default };
    },
  },
  {
    path: '/report',
    lazy: async () => {
      const module = await import('@/pages/legal/ReportAbuse');
      return { Component: module.default };
    },
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
          { path: 'dashboard', lazy: adminRouteLoaders.dashboard },
          { path: 'users', lazy: adminRouteLoaders.users },
          { path: 'messages', lazy: adminRouteLoaders.messages },
          { path: 'groups', lazy: adminRouteLoaders.groups },
          { path: 'activity', lazy: adminRouteLoaders.activity },
          { path: 'media', lazy: adminRouteLoaders.media },
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
