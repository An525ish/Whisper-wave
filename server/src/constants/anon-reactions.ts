/**
 * A reaction is exactly ONE emoji glyph, and nothing else.
 *
 * Any emoji is allowed (the client offers the same picker as the main chat), but the
 * value is validated structurally so it can never carry text: one pictographic base
 * (optionally with skin tone / variation selector, or a ZWJ sequence like a family or
 * a flag) or a keycap. "porn", "kill", zalgo and two emoji in a row are all rejected,
 * so the only thing a client can put in someone else's bubble is a single emoji.
 */
const EMOJI_PART = '\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?';
const EMOJI_RE = new RegExp(
  `^(?:${EMOJI_PART}(?:\\u200D${EMOJI_PART})*|\\p{Regional_Indicator}{2}|[#*0-9]\\uFE0F?\\u20E3)$`,
  'u'
);

/** Longest valid sequence is a ZWJ family (~11 code units); this leaves slack. */
export const ANON_REACTION_MAX_LENGTH = 24;

export const isReactionEmoji = (value: string): boolean =>
  value.length > 0 && value.length <= ANON_REACTION_MAX_LENGTH && EMOJI_RE.test(value);
