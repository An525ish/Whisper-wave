import { useEffect, useRef } from 'react';

/** Resting orientation of the pane when the pointer is away (degrees). */
const REST_TILT_X = 4;
const REST_TILT_Y = -7;

/** How far the pane leans toward the pointer (degrees at the edges). */
const RANGE_X = 8;
const RANGE_Y = 10;

/**
 * Pointer-parallax 3D tilt for the glass pane.
 *
 * Tracks the cursor across `stageRef` and writes `--rx` / `--ry` custom
 * properties onto `targetRef`, which a CSS `transform` consumes. The effect
 * is a no-op for coarse pointers (touch) and when the user prefers reduced
 * motion, so the pane simply rests at its default angle in those cases.
 */
export function useGlassTilt<
  Stage extends HTMLElement = HTMLElement,
  Target extends HTMLElement = HTMLElement,
>() {
  const stageRef = useRef<Stage>(null);
  const targetRef = useRef<Target>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const target = targetRef.current;
    if (!stage || !target) return;

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reduceMotion) return;

    const applyTilt = (rx: number, ry: number) => {
      target.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      target.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const relX = (event.clientX - rect.left) / rect.width - 0.5;
      const relY = (event.clientY - rect.top) / rect.height - 0.5;
      applyTilt(REST_TILT_X - relY * RANGE_X, REST_TILT_Y + relX * RANGE_Y);
    };
    const resetTilt = () => applyTilt(REST_TILT_X, REST_TILT_Y);

    stage.addEventListener('pointermove', handlePointerMove);
    stage.addEventListener('pointerleave', resetTilt);
    return () => {
      stage.removeEventListener('pointermove', handlePointerMove);
      stage.removeEventListener('pointerleave', resetTilt);
    };
  }, []);

  return { stageRef, targetRef };
}
