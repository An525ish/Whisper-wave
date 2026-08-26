export type ClassValue = string | number | false | null | undefined;

/**
 * Join conditional class names into a single string.
 *
 * Falsy values are dropped, so `cn('a', cond && 'b', undefined)` yields
 * `'a'` or `'a b'`. A minimal, dependency-free stand-in for `clsx`.
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
