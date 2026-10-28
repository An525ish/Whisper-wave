import type { ReactNode } from 'react';
import type { NavItem } from '@/shared/types/ui';
import HomeIcon from '@/shared/components/ui/icons/Home';
import WaveIcon from '@/shared/components/ui/icons/Wave';
import MembersIcon from '@/shared/components/ui/icons/Members';
import MemesIcon from '@/shared/components/ui/icons/Memes';
import GamepadIcon from '@/shared/components/ui/icons/Gamepad';
import ChatIcon from '@/shared/components/ui/icons/Chat';
import { buildHubNavSpecs } from './hubNavSpecs';
import type { BuildNavParams } from './types';

const ICONS: Record<string, ReactNode> = {
  home: <HomeIcon />,
  rooms: <MembersIcon />,
  whisper: <WaveIcon />,
  memes: <MemesIcon />,
  games: <GamepadIcon />,
  chats: <ChatIcon />,
};

/** Nav destinations with their icons, shared by the desktop rail and the mobile tab bar. */
export function buildHubNavItems(params: BuildNavParams): NavItem[] {
  return buildHubNavSpecs(params).map((spec) => ({ ...spec, icon: ICONS[spec.id] }));
}
