/**
 * Message look shared by every chat surface (main chat, anonymous chat, rooms), so a
 * bubble, its timestamp and its photo tile read the same everywhere. Change it here.
 */

/** Gap under every message row (rows are measured by the virtualizer, so padding not margin). */
export const MESSAGE_ROW_GAP = 'pb-4';

/** The timestamp + receipt line inside a bubble. */
export const META_ROW_CLASS =
  'inline-flex h-[19px] items-center whitespace-nowrap text-[11px] leading-none tabular-nums';

/** Timestamp pill drawn on top of a photo/GIF when the message has no text. */
export const MEDIA_TIME_CLASS =
  'rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-medium leading-none tracking-wide tabular-nums text-white-pure shadow-sm backdrop-blur-[1px]';

/**
 * Bubble padding by content, outgoing vs incoming. Photo bubbles hug the tile (p-1.5);
 * text bubbles use the roomier 3.5/2 padding.
 */
export const bubblePadding = (kind: 'media' | 'mediaText' | 'text', outgoing: boolean): string => {
  if (kind === 'media') return outgoing ? 'p-1.5' : 'p-1.5 pr-3.5';
  if (kind === 'mediaText') return outgoing ? 'p-1.5 pb-2' : 'p-1.5 pb-2 pr-3.5';
  return outgoing ? 'pl-3.5 pr-2 py-2' : 'pl-3.5 pr-3.5 py-2';
};
