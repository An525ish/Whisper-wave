/** First name of an alias, for copy like "X is gone". */
export const aliasFirstName = (alias: string, fallback = 'They'): string =>
  alias.trim().split(/\s+/)[0] || fallback;