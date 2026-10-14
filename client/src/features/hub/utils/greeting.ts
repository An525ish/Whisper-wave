/** Time-of-day greeting for a local hour (0–23). Pure so it can be tested. */
export const hourGreeting = (hour: number): string => {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Up late?';
};
