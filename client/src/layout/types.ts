import type { NavItem } from '@/shared/types/ui';
import type { HubFeatures } from '@/features/hub';

export type BuildNavParams = {
  /** Server-driven flags — dark surfaces stay out of the nav until enabled. */
  features?: HubFeatures;
  /** Total unread chats. Zero hides the badge. */
  unread: number;
};

/** A nav destination before its icon is attached — the pure, testable half. */
export type NavSpec = Omit<NavItem, 'icon'>;

/**
 * A NEW_MESSAGE socket frame carries more, but the shell only reads `chatId`
 * to clear the typing indicator. The full payload is a chat-domain type.
 */
export type NewMessagePayload = {
  chatId: string;
};
