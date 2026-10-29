/**
 * Headline + subcopy for the auth screen, given the whisper-connect context.
 * Kept out of the component file so fast-refresh can treat that as a component
 * module (it may only export components).
 */
export const whisperAuthCopy = (
  active: boolean,
  self?: string,
  them?: string
): { headline: string; subcopy: string } | null => {
  if (active && self && them) {
    return {
      headline: 'They’re still there.',
      subcopy: `You matched as ${self} and ${them}. One account and you can keep talking.`,
    };
  }
  return null;
};
