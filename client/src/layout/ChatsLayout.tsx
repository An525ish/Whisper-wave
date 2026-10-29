import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChatListPanel } from '@/features/chat';
import {
  ProfileHeader,
  ProfilePanel,
  ProfileSheet,
  useProfileUiStore,
} from '@/features/profile';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';

type ChatsLayoutProps = {
  children: ReactNode;
};

/**
 * The messages app frame: list | conversation | profile rail.
 *
 * Fills the hub shell's content slot (`h-full`, never viewport units — the
 * shell owns the viewport height). Renders under the members-only `/chats*`
 * routes; guests never reach it.
 */
const ChatsLayout = ({ children }: ChatsLayoutProps) => {
  const { chatId } = useParams();
  const isChatOpen = Boolean(chatId);

  const isNarrowProfile = useMediaQuery('(max-width: 1023px)');
  const viewSelfProfile = useProfileUiStore((s) => s.viewSelfProfile);
  const closeSelfProfile = useProfileUiStore((s) => s.closeSelfProfile);

  useEffect(() => {
    closeSelfProfile();
  }, [chatId, closeSelfProfile]);

  return (
    <>
      <main className="flex h-full min-h-0 gap-0 overflow-hidden p-0 pb-[env(safe-area-inset-bottom)] md:gap-2 md:px-3 md:pb-2 md:pt-1.5 lg:gap-3 lg:px-4 lg:pb-3 lg:pt-2">
        {/* Phone/tablet portrait: one pane. md+: list + chat. lg+: + profile. */}
        <aside
          className={`min-h-0 min-w-0 flex-1 bg-background md:rounded-xl md:bg-transparent ${
            isChatOpen ? 'hidden md:block' : 'block'
          }`}
        >
          <ChatListPanel />
        </aside>

        <section
          className={`min-h-0 min-w-0 flex-col ${
            isChatOpen
              ? 'flex flex-1 md:flex-2'
              : 'hidden md:flex md:flex-2'
          }`}
        >
          {children}
        </section>

        <aside className="relative hidden min-h-0 min-w-0 flex-1 lg:flex lg:flex-col">
          <ProfileHeader />
          <ProfilePanel />
        </aside>
      </main>

      <ProfileSheet
        open={viewSelfProfile && isNarrowProfile}
        onClose={closeSelfProfile}
        forceSelf
        title="Edit profile"
      />
    </>
  );
};

export default ChatsLayout;
