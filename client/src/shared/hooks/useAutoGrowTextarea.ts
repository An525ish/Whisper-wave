import { useEffect, useRef } from 'react';
import { MAX_TEXTAREA_HEIGHT } from '@/shared/constants/app';

interface Params {
  /** The controlled value whose length drives the resize. */
  value: string;
  /** Hard cap in px. The floor is the element's own `min-height` utility. */
  maxHeight?: number;
}

/**
 * Grows a textarea to fit its content, capped at `maxHeight`.
 *
 * One implementation for every composer: the anonymous room and the logged-in
 * thread each carried a byte-identical copy of this. Measuring `scrollHeight`
 * against a temporary `height: auto` is what lets the box shrink again once text
 * is deleted, and why the floor is left to the element's `min-height` utility
 * rather than a second hard-coded pixel constant.
 */
export function useAutoGrowTextarea({ value, maxHeight = MAX_TEXTAREA_HEIGHT }: Params) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  return ref;
}