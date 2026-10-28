import { describe, expect, it } from 'vitest';
import { buildHubNavSpecs } from '../hubNavSpecs';

const ids = (params: Parameters<typeof buildHubNavSpecs>[0]) =>
  buildHubNavSpecs(params).map((s) => s.id);

describe('buildHubNavSpecs', () => {
  it('hides dark surfaces until their flag is on', () => {
    expect(ids({ unread: 0 })).toEqual(['home', 'whisper', 'games', 'chats']);
    expect(ids({ unread: 0, features: { rooms: true, games: true, memes: true, privateRooms: false } })).toEqual([
      'home',
      'rooms',
      'whisper',
      'memes',
      'games',
      'chats',
    ]);
  });

  it('lists Games on the rail only, as a coming-soon page', () => {
    const games = buildHubNavSpecs({ unread: 0 }).find((s) => s.id === 'games');
    expect(games?.railOnly).toBe(true);
  });

  it('keeps Memes off the phone tab bar', () => {
    const memes = buildHubNavSpecs({ unread: 0, features: { rooms: false, games: false, memes: true, privateRooms: false } }).find(
      (s) => s.id === 'memes'
    );
    expect(memes?.railOnly).toBe(true);
  });

  it('shows the unread badge only when there is something unread', () => {
    const chats = (unread: number) => buildHubNavSpecs({ unread }).find((s) => s.id === 'chats')?.badge;
    expect(chats(0)).toBeUndefined();
    expect(chats(3)).toBe(3);
  });
});
