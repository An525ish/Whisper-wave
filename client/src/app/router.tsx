import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useParams,
  type RouteObject,
} from 'react-router-dom';
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import HubShell from '@/layout/HubShell';
import { useAuthStore } from '@/features/auth';
import { ROUTES, ROUTE_PATTERNS } from '@/shared/constants/routes';
import { clearPostAuthReturn, peekPostAuthReturn } from '@/shared/utils/postAuthReturn';
import AdminWrapper from '@/layout/AdminWrapper';
import AppLoader from '@/shared/components/ui/loader/AppLoader';
import { useAdminMeQuery, adminRouteLoaders } from '@/features/admin';
import RouteError from '@/app/RouteError';

const Landing = lazy(() => import('@/pages/Landing'));

function ProtectedRoutes({
  allow,
  redirect = ROUTES.auth,
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
  // Members-only gate. The socket itself is mounted once by HubShell, so this
  // stays a pure guard — nesting providers would open a second connection.
  if (!user) return <Navigate to={ROUTES.auth} replace />;
  return <Outlet />;
}

function GuestOnly() {
  const user = useAuthStore((s) => s.user);
  return <ProtectedRoutes allow={!user} redirect={ROUTES.landing} />;
}

/** Landing for guests; members skip straight to the hub home. */
function RootIndex() {
  const user = useAuthStore((s) => s.user);
  // A gated feature (e.g. a private-room invite) may have stashed where to go after sign-in;
  // peek in render (pure), spend it once the redirect is issued.
  useEffect(() => {
    if (user) clearPostAuthReturn();
  }, [user]);
  if (user) return <Navigate to={peekPostAuthReturn() ?? ROUTES.home} replace />;
  return (
    <Suspense fallback={<AppLoader />}>
      <Landing />
    </Suspense>
  );
}

/** Pre-hub bookmarks (`/chat/:id`) keep working by forwarding to `/chats/:id`. */
function LegacyChatRedirect() {
  const { chatId } = useParams();
  return (
    <Navigate to={chatId ? ROUTES.chat(chatId) : ROUTES.chats} replace />
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
    // Everything inside the hub frame: nav rail + content + mobile tab bar.
    // HubShell mounts the member socket once; AuthedLayout below stays a
    // pure gate. Landing / auth / admin keep their own standalone frames.
    element: <HubShell />,
    children: [
      {
        path: ROUTES.home,
        lazy: async () => {
          const module = await import('@/pages/Home');
          return { Component: module.default };
        },
      },
      {
        // Guest-accessible. The phase spec asked for /whisper, /whisper/chat and
        // /whisper/vibe; we use one route driven by store state because a refresh
        // mid-chat would otherwise hit a cold route with no session to restore.
        // The session lives in WhisperSessionProvider, so leaving the route (Back,
        // nav) never destroys a match — the pill brings the user back. Only the
        // explicit Leave/Skip buttons confirm and end it.
        path: ROUTES.whisper,
        lazy: async () => {
          const module = await import('@/pages/Whisper');
          return { Component: module.default };
        },
      },
      {
        // Lean-back shuffle feed for the quiet hours (JokeAPI + Memegen).
        path: ROUTES.memes,
        lazy: async () => {
          const module = await import('@/pages/Memes');
          return { Component: module.default };
        },
      },
      {
        // Other apps by the same maker, shown in an iframe.
        path: ROUTES.apps,
        lazy: async () => {
          const module = await import('@/pages/Apps');
          return { Component: module.default };
        },
      },
      {
        path: ROUTES.feedback,
        lazy: async () => {
          const module = await import('@/pages/Feedback');
          return { Component: module.default };
        },
      },
      {
        path: ROUTES.games,
        lazy: async () => {
          const module = await import('@/pages/Games');
          return { Component: module.default };
        },
      },
      {
        // The messages app. The index renders for everyone (guests see an
        // empty state that points at Whisper, never a wall); a specific
        // conversation is members-only and AuthedLayout sends guests to /auth.
        path: ROUTES.chats,
        children: [
          {
            index: true,
            lazy: async () => {
              const module = await import('@/pages/Chats');
              return { Component: module.default };
            },
          },
          {
            element: <AuthedLayout />,
            children: [
              {
                path: ':chatId',
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
        // Live topic rooms — guests and members. Creation itself is members-only.
        path: ROUTES.rooms,
        children: [
          {
            index: true,
            lazy: async () => {
              const module = await import('@/pages/Rooms');
              return { Component: module.default };
            },
          },
          {
            path: 'new',
            element: <AuthedLayout />,
            children: [
              {
                index: true,
                lazy: async () => {
                  const module = await import('@/pages/NewRoom');
                  return { Component: module.default };
                },
              },
            ],
          },
          {
            path: ':slug',
            lazy: async () => {
              const module = await import('@/pages/Room');
              return { Component: module.default };
            },
          },
        ],
      },
      {
        // Pre-hub bookmarks and old notification deep links.
        path: ROUTE_PATTERNS.legacyChat,
        element: <LegacyChatRedirect />,
      },
    ],
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
    path: '/guidelines',
    lazy: async () => {
      const module = await import('@/pages/legal/Guidelines');
      return { Component: module.default };
    },
  },
  {
    path: '/safety',
    lazy: async () => {
      const module = await import('@/pages/legal/Safety');
      return { Component: module.default };
    },
  },
  {
    path: '/cookies',
    lazy: async () => {
      const module = await import('@/pages/legal/Cookies');
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
          { path: 'rooms', lazy: adminRouteLoaders.rooms },
          { path: 'memes', lazy: adminRouteLoaders.memes },
          { path: 'reports', lazy: adminRouteLoaders.reports },
          { path: 'audit', lazy: adminRouteLoaders.audit },
          { path: 'groups', lazy: adminRouteLoaders.groups },
          { path: 'activity', lazy: adminRouteLoaders.activity },
          { path: 'media', lazy: adminRouteLoaders.media },
        ],
      },
    ],
  },
  {
    path: ROUTES.auth,
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
    path: ROUTES.landing,
    index: true,
    element: <RootIndex />,
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
