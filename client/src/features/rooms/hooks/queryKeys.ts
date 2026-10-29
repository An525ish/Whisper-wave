/** Query keys owned by the rooms domain. */
export const roomsKeys = {
  list: ['rooms', 'list'] as const,
  info: (slug: string | undefined, invite?: string) => ['rooms', 'info', slug, invite ?? null] as const,
  mine: ['rooms', 'mine'] as const,
  reminders: ['rooms', 'reminders'] as const,
  invites: (slug: string | undefined) => ['rooms', 'invites', slug] as const,
};
