import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth';
import { useRoomsList } from '@/features/rooms';
import { useWhisperQuota, usePendingConnectionsQuery } from '@/features/whisper';
import { track } from '@/shared/lib/analytics';
import { HUB_EVENTS } from '../constants';
import { useHubSummary } from '../hooks/useHubSummary';
import HomeBackdrop from './HomeBackdrop';
import HomeDoors from './HomeDoors';
import HomeFooter from './HomeFooter';
import HomeHero from './HomeHero';
import HomeSections from './HomeSections';
import './home.css';

/**
 * The hub home: a midnight-shore page with landing-grade atmosphere —
 * mesh grid, aurora, ripples and grain behind a split hero stage, a
 * three-door launcher, living previews, and a shoreline footer.
 * Composes only — data arrives through domain hooks, sections render
 * it, and every live-data card stays owned by its feature. A summary
 * failure falls back to the static skeleton; the home screen never
 * breaks on a flag fetch.
 */
const HubHome = () => {
  const user = useAuthStore((s) => s.user);
  const { data: summary } = useHubSummary();
  const features = summary?.features;
  // Real remaining count for members (never fires for guests). A failure
  // hides the number — the home screen never breaks on a quota fetch.
  const { data: quota } = useWhisperQuota();
  // In-flight whisper connections, so a returning guest-turned-member sees the
  // one line that matters. Same failure rule as quota: hide, never break.
  const { data: pending } = usePendingConnectionsQuery();
  // Live headcount for the hero greeting. Gated on the flag — no stray
  // requests while the surface ships dark.
  const { data: rooms } = useRoomsList(Boolean(features?.rooms));
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    track(HUB_EVENTS.VIEW, {});
  }, []);

  const liveCount = (rooms ?? []).reduce(
    (sum, room) => sum + (room.open ? room.totalOnline : 0),
    0
  );

  const handleCardClick = (id: string) => {
    track(HUB_EVENTS.CARD_CLICK, { card: id });
  };

  return (
    <div className="hw-page relative min-h-dvh">
      <HomeBackdrop />
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 md:gap-12 md:px-8 md:py-12">
        <div className="hw-rise" style={{ '--hw-d': '0ms' } as React.CSSProperties}>
          <HomeHero
            userName={user?.name ?? null}
            quotaText={
              user && quota ? `${quota.remaining} of ${quota.limit} left today` : undefined
            }
            quotaExhausted={Boolean(user && quota && quota.remaining <= 0)}
            liveCount={liveCount}
            roomsLive={Boolean(features?.rooms)}
            onWhisperClick={() => handleCardClick('whisper')}
            onRoomsClick={() => handleCardClick('rooms-hero')}
          />
        </div>

        <div className="hw-rise" style={{ '--hw-d': '60ms' } as React.CSSProperties}>
          <HomeDoors
            roomsLive={Boolean(features?.rooms)}
            memesLive={Boolean(features?.memes)}
            liveCount={liveCount}
            quotaExhausted={Boolean(user && quota && quota.remaining <= 0)}
            onDoorClick={handleCardClick}
          />
        </div>

        <HomeSections
          roomsLive={Boolean(features?.rooms)}
          memesLive={Boolean(features?.memes)}
          onDoorClick={handleCardClick}
        />

        <HomeFooter
          signedIn={Boolean(user)}
          pendingCount={pending?.length ?? 0}
          onNavigate={handleCardClick}
        />
      </main>
    </div>
  );
};

export default HubHome;
