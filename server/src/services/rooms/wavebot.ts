import { allInstanceIds, appendMessage, membersOf, recentMessages } from './registry.js';

/**
 * Wave bot prompts — authored content, a list in the repo (never a model).
 *
 * The bot is always labelled, never mimics a person, never collects data.
 * It posts only into quiet rooms (nothing for IDLE_MS, 2+ people present),
 * and never twice in a row — a monologueing bot is worse than silence.
 */
const PROMPTS = [
  'What’s keeping you up tonight?',
  'What’s a song you have on repeat right now?',
  'What’s something small that made today better?',
  'If you could be anywhere right now, where?',
  'What’s a game you keep coming back to?',
  'What’s the last thing that made you laugh out loud?',
  'Night cry or night drive — pick one and defend it.',
  'What’s a skill you secretly want to learn?',
];

/** How long a room must sit quiet before the bot speaks. */
export const WAVE_IDLE_MS = 10 * 60 * 1000;

export const WAVE_ALIAS = 'Wave';
export const WAVE_COLOR = '#ffd47d';

const lastPromptIndex = new Map<string, number>();

/**
 * Post one prompt into each quiet instance. Pure decision + append; the
 * caller owns emission (namespace) so this stays socket-free and testable.
 * Returns the posted messages for fan-out.
 */
export const sweepQuietRooms = (
  now: number = Date.now()
): Array<{ instanceId: string; message: { id: string; text: string; ts: number } }> => {
  const posted: Array<{ instanceId: string; message: { id: string; text: string; ts: number } }> = [];
  for (const instanceId of allInstanceIds()) {
    if (membersOf(instanceId).length < 2) continue;
    const recent = recentMessages(instanceId, 1);
    const last = recent[0];
    if (last && now - last.ts < WAVE_IDLE_MS) continue;
    if (last?.alias === WAVE_ALIAS) continue;
    const next = (lastPromptIndex.get(instanceId) ?? -1) + 1;
    lastPromptIndex.set(instanceId, next);
    const message = appendMessage(instanceId, {
      alias: WAVE_ALIAS,
      color: WAVE_COLOR,
      role: 'member',
      text: PROMPTS[next % PROMPTS.length] ?? PROMPTS[0] ?? '…',
      system: true,
      ts: now,
    });
    if (message) posted.push({ instanceId, message: { id: message.id, text: message.text, ts: message.ts } });
  }
  return posted;
};
