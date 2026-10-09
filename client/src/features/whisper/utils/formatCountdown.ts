/** `"9:05"` — remaining ms as m:ss, rounded UP so it never shows 0:00 while time remains. */
export const formatCountdown = (msLeft: number): string => {
  const totalSeconds = Math.ceil(Math.max(0, msLeft) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};
