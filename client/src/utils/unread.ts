/** Format unread counts for badges (list, header, etc.). */
export const formatUnreadCount = (count: number): string =>
  count > 99 ? '99+' : String(count);
