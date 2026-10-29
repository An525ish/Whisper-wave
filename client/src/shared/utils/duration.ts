/** `"9:05"` — remaining ms as m:ss, rounded UP so it never shows 0:00 while time remains. */
export const formatCountdown = (msLeft: number): string => {
  const totalSeconds = Math.ceil(Math.max(0, msLeft) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

/**
 * "How long until this vanishes", as a short phrase: `under a minute`,
 * `42 min`, `23h 50m`, `1d`. One formatter for threads, invites and pending rows
 * so they never disagree.
 */
export const expiryLabel = (msLeft: number): string => {
  const mins = Math.floor(msLeft / 60_000);
  if (mins < 1) return 'under a minute';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  return hours < 24 ? `${hours}h ${mins % 60}m` : `${Math.floor(hours / 24)}d`;
};
