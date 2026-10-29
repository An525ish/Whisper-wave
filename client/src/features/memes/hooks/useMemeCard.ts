import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { track } from '@/shared/lib/analytics';
import { MEME_EVENTS } from '../constants';
import { useMemeStore } from '../stores/memeStore';
import { useToggleMemeSave } from './useMemeSaves';
import type { MemeItem } from '../types';

/** Everything one joke card decides: reactions, save, hide, and its two dialogs. */
export function useMemeCard(item: MemeItem) {
  const reaction = useMemeStore((s) => s.reactions[item.id]);
  const saved = useMemeStore((s) => s.saves.includes(item.id));
  const toggleReaction = useMemeStore((s) => s.toggleReaction);
  const hide = useMemeStore((s) => s.hide);
  const toggleSave = useToggleMemeSave();
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [hideOpen, setHideOpen] = useState(false);

  const react = useCallback(
    (glyph: string) => {
      toggleReaction(item.id, glyph);
      if (useMemeStore.getState().reactions[item.id] === glyph) {
        track(MEME_EVENTS.REACT, { reaction: glyph });
      }
    },
    [item.id, toggleReaction]
  );

  const hideIt = useCallback(() => {
    hide(item.id);
    track(MEME_EVENTS.HIDE, {});
    toast.success('Hidden. You won’t see this one again.');
  }, [hide, item.id]);

  const save = useCallback(() => toggleSave(item.id), [toggleSave, item.id]);

  return {
    reaction,
    saved,
    react,
    save,
    hideIt,
    shareOpen,
    openShare: () => setShareOpen(true),
    closeShare: () => setShareOpen(false),
    reportOpen,
    openReport: () => setReportOpen(true),
    closeReport: () => setReportOpen(false),
    hideOpen,
    openHide: () => setHideOpen(true),
    closeHide: () => setHideOpen(false),
  };
}
