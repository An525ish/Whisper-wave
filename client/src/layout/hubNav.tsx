import type { NavItem } from '@/shared/types/ui';
import { ROUTES } from '@/shared/constants/routes';
import HomeIcon from '@/shared/components/ui/icons/Home';
import WaveIcon from '@/shared/components/ui/icons/Wave';
import MembersIcon from '@/shared/components/ui/icons/Members';
import MemesIcon from '@/shared/components/ui/icons/Memes';
import PlayIcon from '@/shared/components/ui/icons/Play';
import ChatIcon from '@/shared/components/ui/icons/Chat';
import ExternalLinkIcon from '@/shared/components/ui/icons/ExternalLink';
import type { HubFeatures } from '@/features/hub';

interface BuildNavParams {
  /** Server-driven flags — dark surfaces stay out of the nav until enabled. */
  features?: HubFeatures;
  /** Total unread chats. Zero hides the badge. */
  unread: number;
  /** Guests get a sign-in door instead of the members-only Chats. */
  isMember: boolean;
}

/**
 * The hub's primary destinations, shared by the desktop rail and the mobile
 * tab bar. Order matters: Whisper sits in the middle as the emphasized action.
 */
export function buildHubNavItems({
  features,
  unread,
  isMember,
}: BuildNavParams): NavItem[] {
  const items: NavItem[] = [
    { id: 'home', label: 'Home', to: ROUTES.home, icon: <HomeIcon /> },
  ];

  if (features?.rooms) {
    items.push({
      id: 'rooms',
      label: 'Rooms',
      to: ROUTES.rooms,
      icon: <MembersIcon />,
    });
  }

  items.push({
    id: 'whisper',
    label: 'Whisper',
    to: ROUTES.whisper,
    icon: <WaveIcon />,
    emphasis: true,
  });

  if (features?.memes) {
    items.push({
      id: 'memes',
      label: 'Memes',
      to: ROUTES.memes,
      icon: <MemesIcon />,
    });
  }

  if (features?.games) {
    items.push({
      id: 'play',
      label: 'Play',
      to: ROUTES.play,
      icon: <PlayIcon />,
    });
  }

  if (isMember) {
    items.push({
      id: 'chats',
      label: 'Chats',
      to: ROUTES.chats,
      icon: <ChatIcon />,
      badge: unread || undefined,
    });
  } else {
    items.push({
      id: 'signin',
      label: 'Sign in',
      to: ROUTES.authLogin,
      icon: <ExternalLinkIcon />,
    });
  }

  return items;
}
