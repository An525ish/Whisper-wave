import { logger } from '../utils/logger.js';
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

/**
 * Copy and machine-readable class for one of the middleware's built-in rejections.
 *
 * `reason` is prose for a person and will be reworded over time. `code` is the part
 * a client is allowed to branch on — the same lesson as the `session_ended` ack,
 * which existed because a client was pattern-matching English.
 */
type SocketRejection = {
  reason: string;
  code?: string;
};

type SocketEventOptions = {
  /**
   * Runs before Zod parse (e.g. rate limit) — return false to drop the event.
   *
   * May answer asynchronously. `/anon` passes the Redis-backed limiter, whose
   * verdict needs a round trip; the signed-in chat passes the in-process one,
   * which answers immediately. Both are awaited, and a synchronous answer costs
   * one microtask that no caller can observe.
   *
   * What must not move is the ORDER: this runs before the schema parse, so an
   * event that is over budget is acked without ever being validated.
   */
  before?: () => boolean | Promise<boolean>;
  onError?: (error: unknown) => void;
  /**
   * Overrides for the three rejections this middleware can produce on its own.
   *
   * Every one defaults to the message-flavoured copy below, which is wrong for a
   * reaction ("Too many messages" when the caller tapped an emoji) and carries no
   * code at all, so the client can only put prose on screen. Events where the
   * client needs to *act* differently should pass their own.
   */
  rejections?: {
    rateLimited?: SocketRejection;
    invalidPayload?: SocketRejection;
    handlerFailed?: SocketRejection;
  };
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
 *
 * The body is an async function because `before` may be async. It does not queue
 * work behind a lock: two events from one socket are still dispatched in arrival
 * order, because each one reaches its handler on its own turn of the microtask
 * queue and the handler is invoked synchronously at that point.
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
    const reject = options?.rejections;

    const dispatch = async (): Promise<void> => {
      if (options?.before && !(await options.before())) {
        ack?.({
          ok: false,
          ...(reject?.rateLimited ?? {
            reason: 'Too many messages — slow down a little.',
          }),
        });
        return;
      }

      const data = parseSocketPayload(schema, payload);
      if (!data) {
        const id =
          payload && typeof payload === 'object' && 'id' in payload
            ? String((payload as { id: unknown }).id ?? '')
            : undefined;
        ack?.({
          ok: false,
          id,
          ...(reject?.invalidPayload ?? { reason: 'That message could not be sent.' }),
        });
        return;
      }

      try {
        await handler(data, ...rest);
      } catch (error) {
        options?.onError?.(error);
        ack?.({
          ok: false,
          ...(reject?.handlerFailed ?? { reason: 'Something went wrong sending that.' }),
        });
      }
    };

    void dispatch().catch((error: unknown) => {
      // Only `before` can reject at this point — a handler's own errors are
      // caught inside `dispatch`. A limiter that throws must not escape as an
      // unhandled rejection and take the process down, and must not quietly let
      // the event through either: drop it and say so.
      logger.error({ err: error, event }, 'Socket before() hook failed');
      ack?.({
        ok: false,
        ...(reject?.handlerFailed ?? { reason: 'Something went wrong sending that.' }),
      });
    });
  });
};
