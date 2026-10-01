import type { Socket } from 'socket.io';
import type { ZodType, z } from 'zod';

/** Socket counterpart to HTTP `validate()` — parse untrusted inbound payloads. */
const parseSocketPayload = <Schema extends ZodType>(
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
 *
 * Any arguments after the payload (notably a Socket.IO acknowledgement callback)
 * are forwarded to the handler untouched, so a client can be told whether its
 * optimistic UI should settle as sent or failed. Events that are dropped —
 * rate limited or schema-invalid — still invoke the ack with a failure when one
 * was supplied, otherwise the sender would wait forever.
 */
export const onSocketEvent = <Schema extends ZodType>(
  socket: Socket,
  event: string,
  schema: Schema,
  handler: (data: z.infer<Schema>, ...rest: unknown[]) => void | Promise<void>,
  options?: SocketEventOptions
): void => {
  socket.on(event, (payload: unknown, ...rest: unknown[]) => {
    const ack = rest.find((arg) => typeof arg === 'function') as
      | ((res: unknown) => void)
      | undefined;

    if (options?.before && !options.before()) {
      ack?.({ ok: false, reason: 'Too many messages — slow down a little.' });
      return;
    }

    const data = parseSocketPayload(schema, payload);
    if (!data) {
      const id =
        payload && typeof payload === 'object' && 'id' in payload
          ? String((payload as { id: unknown }).id ?? '')
          : undefined;
      ack?.({ ok: false, id, reason: 'That message could not be sent.' });
      return;
    }

    void Promise.resolve(handler(data, ...rest)).catch((error) => {
      options?.onError?.(error);
      ack?.({ ok: false, reason: 'Something went wrong sending that.' });
    });
  });
};
