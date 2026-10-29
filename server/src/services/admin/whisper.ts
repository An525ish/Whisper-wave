import { getWhisperStats as getMatchStats } from '../match/stats.js';
import { livePeople } from '../rooms/registry.js';

/** Anon matchmaking stats plus a live look at the rooms. */
export const getWhisperStats = async (days: number) => ({
  ...(await getMatchStats(days)),
  rooms: livePeople(),
});
