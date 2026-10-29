import { describe, expect, it } from 'vitest';
import { buildHubNavSpecs } from '../hubNavSpecs';
import { toTabOrder } from '../hubNav';

const ids = (params: Parameters<typeof buildHubNavSpecs>[0]) =>
  buildHubNavSpecs(params).map((s) => s.id);

describe('buildHubNavSpecs', () => {
  it('hides dark surfaces until their flag is on', () => {
    expect(ids({ unread: 0 })).toEqual(['home', 'chats', 'whisper', 'games', 'apps']);
    expect(ids({ unread: 0, features: { rooms: true, games: true, memes: true, privateRooms: false } })).toEqual([
      'home',
      'rooms',
      'chats',
      'whisper',
      'memes',
      'games',
      'apps',
    ]);
  });

  it('keeps Whisper centred: Memes takes the slot after it when live, else Games', () => {
    const tabs = (memes: boolean) =>
      toTabOrder(
        buildHubNavSpecs({ unread: 0, features: { rooms: true, games: false, memes, privateRooms: false } }).map(
          (s) => ({ ...s, icon: null }),
        ),
      ).map((s) => s.id);
    expect(tabs(true)).toEqual(['home', 'rooms', 'whisper', 'memes', 'chats']);
    expect(tabs(false)).toEqual(['home', 'rooms', 'whisper', 'games', 'chats']);
  });

  it('shows the unread badge only when there is something unread', () => {
    const chats = (unread: number) => buildHubNavSpecs({ unread }).find((s) => s.id === 'chats')?.badge;
    expect(chats(0)).toBeUndefined();
    expect(chats(3)).toBe(3);
  });
});
