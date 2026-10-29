import { ROUTES } from '@/shared/constants/routes';
import type { BuildNavParams, NavSpec } from './types';

/**
 * The hub's primary destinations, as data. Order matters: Whisper sits in the
 * middle as the emphasized action. On phones the bar holds five slots so Whisper
 * stays centred: Memes takes the slot after Whisper when live, otherwise the
 * coming-soon Games page (D7) does; the other stays `railOnly`. Chats is always
 * listed: a guest lands on an empty state that points at Whisper, never a wall.
 */
export function buildHubNavSpecs({ features, unread }: BuildNavParams): NavSpec[] {
  const specs: NavSpec[] = [{ id: 'home', label: 'Home', to: ROUTES.home }];

  if (features?.rooms) {
    specs.push({ id: 'rooms', label: 'Rooms', to: ROUTES.rooms });
  }

  // Rail order: Chats sits right under Rooms. The phone bar moves it back to the
  // end so Whisper stays centred (see `toTabOrder` in hubNav.tsx).
  specs.push({ id: 'chats', label: 'Chats', to: ROUTES.chats, badge: unread || undefined });

  specs.push({ id: 'whisper', label: 'Whisper', to: ROUTES.whisper, emphasis: true });

  if (features?.memes) {
    specs.push({ id: 'memes', label: 'Memes', to: ROUTES.memes });
  }

  specs.push({ id: 'games', label: 'Games', to: ROUTES.games, railOnly: Boolean(features?.memes) });

  specs.push({ id: 'apps', label: 'Apps', to: ROUTES.apps, railOnly: true });

  return specs;
}
