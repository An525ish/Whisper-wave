import { create } from 'zustand';

/** Message ids of a stranger's photos the user chose to unblur. Shared by the bubble and the panel grid. */
type State = { ids: Record<string, true>; reveal: (id: string) => void; clear: () => void };

export const useRevealedPhotos = create<State>((set) => ({
  ids: {},
  reveal: (id) => set((s) => (s.ids[id] ? s : { ids: { ...s.ids, [id]: true } })),
  clear: () => set({ ids: {} }),
}));
