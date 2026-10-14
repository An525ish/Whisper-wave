import { useCallback, useMemo, type ReactNode } from 'react';
import { Link, Outlet, useMatch, useParams } from 'react-router-dom';
import { SocketProvider } from '@/shared/lib/socket/SocketProvider';
import { ROUTES, ROUTE_PATTERNS } from '@/shared/constants/routes';
import type { NavItem } from '@/shared/types/ui';
import NavRail from '@/shared/components/nav/NavRail';
import BottomTabBar from '@/shared/components/nav/BottomTabBar';
import { track } from '@/shared/lib/analytics';
import { HUB_EVENTS, useHubSummary, type HubFeatures } from '@/features/hub';
import { GhostBanner, useAuthStore } from '@/features/auth';
import { Title, usePushSession } from '@/features/notifications';
import { AccountBar } from '@/features/profile';
import { useMyChatsQuery } from '@/features/chat';
import { LiveWhisperPill, WhisperSessionProvider, useWhisperConnectResume } from '@/features/whisper';
import { useAppSocketEvents } from './useAppSocketEvents';
import { buildHubNavItems } from './hubNav';

type ShellChromeProps = {
  items: NavItem[];
  footer: ReactNode;
  hideTabBar: boolean;
  hidePill: boolean;
};

/**
 * The neutral hub frame: desktop rail + scrollable content + mobile tab bar.
 * Section-independent only — auth bootstrap, sockets, presence, notifications
 * and whisper resume live in the authed shell below, never here.
 */
const ShellChrome = ({ items, footer, hideTabBar, hidePill }: ShellChromeProps) => {
  const isImpersonated = useAuthStore((s) => s.isImpersonated);

  const handleNavigate = useCallback((id: string) => {
    track(HUB_EVENTS.NAV_CLICK, { dest: id });
  }, []);

  return (
    <>
      <Title />
      {isImpersonated && <GhostBanner />}

      <div className="flex h-dvh overflow-hidden">
        <NavRail
          items={items}
          ariaLabel="Primary"
          onNavigate={handleNavigate}
          className="hidden lg:flex"
          header={
            <div className="flex w-full flex-col items-center">
              <Link
                to={ROUTES.home}
                aria-label="Whisper Wave home"
                className="grid h-12 w-12 place-items-center rounded-2xl transition hover:bg-white/[0.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
              >
                <img
                  src="/logo-4.png"
                  alt=""
                  className="h-11 w-11 object-contain"
                />
              </Link>
              <div
                aria-hidden
                className="mb-1 mt-2 h-px w-4/5 bg-linear-to-r from-transparent via-border to-transparent"
              />
            </div>
          }
          footer={footer}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </div>
          {/* The way back into a live whisper from anywhere else in the hub.
              Self-hides on the whisper route and when no session is live. */}
          {!hidePill && <LiveWhisperPill />}
          {!hideTabBar && (
            <BottomTabBar
              items={items}
              ariaLabel="Primary"
              onNavigate={handleNavigate}
              className="lg:hidden"
            />
          )}
        </div>
      </div>
    </>
  );
};

/** Shared nav data: server flags (public) + member-only unread badge. */
function useNavItems(isMember: boolean): NavItem[] {
  const { data: summary } = useHubSummary();
  const features: HubFeatures | undefined = summary?.features;
  const { data: chats } = useMyChatsQuery({ skip: !isMember });

  return useMemo(() => {
    const rows = chats?.data;
    const unread =
      rows?.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0) ?? 0;
    return buildHubNavItems({ features, unread });
  }, [chats, features]);
}

/** A live room thread (`/rooms/:slug`), not the create form at `/rooms/new`. */
function useRoomThreadMatch(): boolean {
  const match = useMatch(ROUTE_PATTERNS.room);
  return Boolean(match) && match?.params.slug !== 'new';
}

const AuthedHubShell = () => {
  const { chatId } = useParams();
  // Finish a Whisper "connect & reveal" if the guest just signed in.
  useWhisperConnectResume();
  useAppSocketEvents({ suppressedChatId: chatId });
  usePushSession();
  const items = useNavItems(true);
  const inConversation = useMatch(ROUTE_PATTERNS.chat);
  const inRoom = useRoomThreadMatch();
  const inWhisper = useMatch(ROUTES.whisper);
  // Full-screen threads own the whole viewport; Whisper keeps the bar (plan §7.2.1).
  const hideTabBar = Boolean(inConversation) || inRoom;

  return (
    <ShellChrome
      items={items}
      hideTabBar={hideTabBar}
      hidePill={Boolean(inWhisper)}
      footer={
        <div className="flex justify-center">
          <AccountBar variant="account" menuPlacement="up" avatarOnly />
        </div>
      }
    />
  );
};

const GuestHubShell = () => {
  const items = useNavItems(false);
  const inWhisper = useMatch(ROUTES.whisper);
  const hideTabBar = useRoomThreadMatch();

  return (
    <ShellChrome
      items={items}
      hideTabBar={hideTabBar}
      hidePill={Boolean(inWhisper)}
      footer={
        <Link
          to={ROUTES.authLogin}
          className="px-1 text-center text-[11px] font-medium leading-tight text-body-300 transition hover:text-green focus-visible:outline-2 focus-visible:outline-green"
        >
          Sign in
        </Link>
      }
    />
  );
};

/**
 * Hub entry frame for everyone. Members get the authed socket, presence and
 * notification subscriptions; guests get the same chrome without ever opening
 * a socket connection. The whisper session outlives both branches, so a live
 * whisper survives navigating anywhere in the hub.
 */
const HubShell = () => {
  const user = useAuthStore((s) => s.user);

  return (
    <WhisperSessionProvider>
      {!user ? (
        <GuestHubShell />
      ) : (
        <SocketProvider>
          <AuthedHubShell />
        </SocketProvider>
      )}
    </WhisperSessionProvider>
  );
};

export default HubShell;
