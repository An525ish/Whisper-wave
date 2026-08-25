/** Strip leading/trailing whitespace. */
export const trim = (value: string): string => value.trim();

/** Trim string; return `undefined` when empty or missing. */
export const trimOptional = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed || undefined;
};

/** Canonical email for storage and lookup (trim + lowercase). */
export const normalizeEmail = (email: string): string =>
  email.trim().toLowerCase();
