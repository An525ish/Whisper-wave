import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MEME_HIDDEN_CAP, MEME_STORE_KEY } from '../constants';

type MemeState = {
  /** jokeId → reaction glyph. Tap again to untoggle. */
  reactions: Record<number, string>;
  /** Saved joke ids — on-device for everyone; members also sync to the server. */
  saves: number[];
  /** Hidden joke ids, newest last — never rendered again on this browser. Capped. */
  hidden: number[];
  toggleReaction: (id: number, reaction: string) => void;
  toggleSave: (id: number) => void;
  mergeSaves: (ids: number[]) => void;
  hide: (id: number) => void;
};

/**
 * Local meme state. Reactions and hides live on the device; saves live here
 * for everyone and sync to the account for members (additive union on load).
 * Hidden ids are capped so the persisted blob can't grow without bound.
 */
export const useMemeStore = create<MemeState>()(
  persist(
    (set) => ({
      reactions: {},
      saves: [],
      hidden: [],

      toggleReaction: (id, reaction) =>
        set((s) => {
          const reactions = { ...s.reactions };
          if (reactions[id] === reaction) delete reactions[id];
          else reactions[id] = reaction;
          return { reactions };
        }),

      toggleSave: (id) =>
        set((s) => ({
          saves: s.saves.includes(id) ? s.saves.filter((saved) => saved !== id) : [...s.saves, id],
        })),

      /** Union server ids in (member sign-in) — additive, never destructive. */
      mergeSaves: (ids) =>
        set((s) => ({
          saves: [...new Set([...s.saves, ...ids])],
        })),

      hide: (id) =>
        set((s) =>
          s.hidden.includes(id) ? s : { hidden: [...s.hidden, id].slice(-MEME_HIDDEN_CAP) }
        ),
    }),
    {
      name: MEME_STORE_KEY,
      partialize: (state) => ({
        reactions: state.reactions,
        saves: state.saves,
        hidden: state.hidden,
      }),
    }
  )
);
