import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MEME_STORE_KEY } from '../constants';

type MemeState = {
  /** jokeId → reaction glyph. Tap again to untoggle. */
  reactions: Record<number, string>;
  /** Saved joke ids (local for everyone in v1; member sync is next). */
  saves: number[];
  /** Hidden joke ids — never rendered again on this browser. */
  hidden: number[];
  toggleReaction: (id: number, reaction: string) => void;
  toggleSave: (id: number) => void;
  mergeSaves: (ids: number[]) => void;
  hide: (id: number) => void;
};

/**
 * Local meme state. Reactions, saves and hides live on the device in v1 —
 * the feed reads the same for guests and members, and nothing here needs an
 * account. Member-synced saves come with the MemeSave model next.
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
        set((s) => (s.hidden.includes(id) ? s : { hidden: [...s.hidden, id] })),
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
