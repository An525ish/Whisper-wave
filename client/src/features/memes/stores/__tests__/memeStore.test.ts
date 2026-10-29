import { beforeEach, describe, expect, it } from 'vitest';
import { MEME_HIDDEN_CAP } from '../../constants';
import { useMemeStore } from '../memeStore';

beforeEach(() => {
  useMemeStore.setState({ reactions: {}, saves: [], hidden: [] });
});

describe('memeStore', () => {
  it('toggles a reaction on and off, and swaps to a different glyph', () => {
    const { toggleReaction } = useMemeStore.getState();
    toggleReaction(1, '🔥');
    expect(useMemeStore.getState().reactions[1]).toBe('🔥');
    toggleReaction(1, '💀');
    expect(useMemeStore.getState().reactions[1]).toBe('💀');
    toggleReaction(1, '💀');
    expect(useMemeStore.getState().reactions[1]).toBeUndefined();
  });

  it('toggles saves and unions server ids without duplicates', () => {
    const { toggleSave, mergeSaves } = useMemeStore.getState();
    toggleSave(5);
    mergeSaves([5, 6]);
    expect(useMemeStore.getState().saves.sort()).toEqual([5, 6]);
    toggleSave(5);
    expect(useMemeStore.getState().saves).toEqual([6]);
  });

  it('hides once and caps the list, dropping the oldest', () => {
    const { hide } = useMemeStore.getState();
    hide(1);
    hide(1);
    expect(useMemeStore.getState().hidden).toEqual([1]);
    for (let id = 2; id <= MEME_HIDDEN_CAP + 5; id += 1) hide(id);
    const { hidden } = useMemeStore.getState();
    expect(hidden).toHaveLength(MEME_HIDDEN_CAP);
    expect(hidden.includes(1)).toBe(false);
    expect(hidden[hidden.length - 1]).toBe(MEME_HIDDEN_CAP + 5);
  });
});
