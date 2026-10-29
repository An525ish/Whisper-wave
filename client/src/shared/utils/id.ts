/** Opaque client id (idempotency keys, optimistic rows): `[A-Za-z0-9_-]`, ≤ 64 chars. */
export const newClientId = (): string => {
  const c = globalThis.crypto;
  if (c && 'randomUUID' in c) return c.randomUUID();
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};
