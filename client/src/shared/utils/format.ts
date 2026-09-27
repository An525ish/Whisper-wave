/** Format unread counts for badges and titles (list, header, tab title, etc.). */
export const formatUnreadCount = (count: number): string =>
  count > 99 ? '99+' : String(count);
