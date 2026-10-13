/**
 * "How long until this thread vanishes", as a short phrase: `under a minute`,
 * `42 min`, `23h 50m`, `1d`. Shared by the thread's expiry line and the profile's vanish clock
 * so the two never disagree.
 */
export const expiryLabel = (msLeft: number): string => {
  const mins = Math.floor(msLeft / 60_000);
  if (mins < 1) return 'under a minute';
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  return hours < 24 ? `${hours}h ${mins % 60}m` : `${Math.floor(hours / 24)}d`;
};
