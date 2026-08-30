import type { Socket } from 'socket.io';
import type { ZodType, z } from 'zod';

/**
 * Socket counterpart to HTTP `validate()` — parse untrusted inbound payloads.
 * Invalid payloads are dropped (no HTTP response on sockets).
 */
export const parseSocketPayload = <Schema extends ZodType>(
  schema: Schema,
  payload: unknown
): z.infer<Schema> | null => {
  const result = schema.safeParse(payload);
  return result.success ? result.data : null;
};

type SocketEventOptions = {
  /** Runs before Zod parse (e.g. rate limit) — return false to drop the event. */
  before?: () => boolean;
  onError?: (error: unknown) => void;
};

/**
 * Per-event "middleware + handler" — mirrors `validate(schema)` + controller on HTTP routes.
 * Socket.IO only has connection-level `io.use()`; inbound events use this instead.
 */
export const onSocketEvent = <Schema extends ZodType>(
  socket: Socket,
  event: string,
  schema: Schema,
  handler: (data: z.infer<Schema>) => void | Promise<void>,
  options?: SocketEventOptions
): void => {
  socket.on(event, (payload: unknown) => {
    if (options?.before && !options.before()) return;

    const data = parseSocketPayload(schema, payload);
    if (!data) return;

    void Promise.resolve(handler(data)).catch((error) => {
      options?.onError?.(error);
    });
  });
};
