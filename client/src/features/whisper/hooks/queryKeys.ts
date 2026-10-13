/**
 * TanStack query keys for the whisper domain.
 * Every key in this feature lives here — never inline in a hook or component.
 */
export const queryKeys = {
  /** The "how we met" story behind a DM. */
  connectionOrigin: (chatId: string | undefined) =>
    ['connection-origin', chatId] as const,
} as const;
