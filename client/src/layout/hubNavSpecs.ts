import { ROUTES } from '@/shared/constants/routes';
import type { BuildNavParams, NavSpec } from './types';

/**
 * The hub's primary destinations, as data. Order matters: Whisper sits in the
 * middle as the emphasized action. Memes lives inside Home on phones
 * (`railOnly`), Games is skipped by decision (D7), and Chats is always listed —
 * a guest lands on an empty state that points at Whisper, never a wall.
 */
export function buildHubNavSpecs({ features, unread }: BuildNavParams): NavSpec[] {
  const specs: NavSpec[] = [{ id: 'home', label: 'Home', to: ROUTES.home }];

  if (features?.rooms) {
    specs.push({ id: 'rooms', label: 'Rooms', to: ROUTES.rooms });
  }

  specs.push({ id: 'whisper', label: 'Whisper', to: ROUTES.whisper, emphasis: true });

  if (features?.memes) {
    specs.push({ id: 'memes', label: 'Memes', to: ROUTES.memes, railOnly: true });
  }

  specs.push({ id: 'chats', label: 'Chats', to: ROUTES.chats, badge: unread || undefined });

  return specs;
}
