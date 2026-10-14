import { describe, expect, it } from 'vitest';
import { buildHubNavSpecs } from '../hubNavSpecs';

const ids = (params: Parameters<typeof buildHubNavSpecs>[0]) =>
  buildHubNavSpecs(params).map((s) => s.id);

describe('buildHubNavSpecs', () => {
  it('hides dark surfaces until their flag is on', () => {
    expect(ids({ unread: 0 })).toEqual(['home', 'whisper', 'chats']);
    expect(ids({ unread: 0, features: { rooms: true, games: true, memes: true, privateRooms: false } })).toEqual([
      'home',
      'rooms',
      'whisper',
      'memes',
      'chats',
    ]);
  });

  it('never surfaces Games, even when the server flag is on', () => {
    expect(ids({ unread: 0, features: { rooms: false, games: true, memes: false, privateRooms: false } })).not.toContain('play');
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
