import { RADAR_FLOAT_MAX_CHIPS, RADAR_WHISPER_CHIPS } from '../constants';
import { hashSeed, mulberry32 } from './seededRandom';
import { vibeTagLabel } from './vibeTag';
import type { VibeTag } from '../types';

type RadarFloatTone = 'violet' | 'green';

export type RadarFloatItem =
  | { kind: 'tag'; key: string; label: string; tone: RadarFloatTone }
  | { kind: 'whisper'; key: string; label: string; tone: RadarFloatTone }
  | { kind: 'figure'; key: string; inner?: boolean; size: number; tone: RadarFloatTone };

export type RadarFloatSpot = { top: string; left: string };

/**
 * The equaliser pill sits at the bottom of the stage (`left/right: 12%`,
 * `bottom: 8%`). Skip that sector. Angle 0° is straight up; ±180° is down.
 */
const WAVE_GAP_HALF_DEG = 52;

function spotFromAngle(angleDeg: number, r: number): RadarFloatSpot {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    left: `${50 + Math.sin(rad) * r * 100}%`,
    top: `${50 - Math.cos(rad) * r * 100}%`,
  };
}

/** Centre face — just below the green pulse between the chat bubbles. */
function innerSpot(): RadarFloatSpot {
  return { left: '50%', top: '54%' };
}

/**
 * Place items in list order along the arc (wave gap clear).
 *
 * Order is preserved angularly so chip→anon→chip→anon→chip stays neighbours
 * on screen — never two chips side by side. Gaps are uneven (seeded) so it
 * doesn't look like a perfect fan.
 */
function arrangeInArcOrder(count: number, seed: string): RadarFloatSpot[] {
  if (count <= 0) return [];
  const rand = mulberry32(hashSeed(seed));

  const start = -180 + WAVE_GAP_HALF_DEG;
  const span = 360 - WAVE_GAP_HALF_DEG * 2;

  if (count === 1) {
    return [spotFromAngle(start + span * 0.5, 0.4 + rand() * 0.04)];
  }

  // Uneven gap weights → irregular spacing, still strictly sequential.
  const weights = Array.from({ length: count - 1 }, () => 0.55 + rand());
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const angles: number[] = [start + span * (0.06 + rand() * 0.04)];
  const usable = span * (0.88 + rand() * 0.04);
  for (let i = 0; i < weights.length; i++) {
    angles.push(angles[i] + (weights[i] / weightSum) * usable);
  }

  return angles.map((angleDeg) => spotFromAngle(angleDeg, 0.38 + rand() * 0.07));
}

/** Pick `n` whisper labels from the pool, order stable for a given seed. */
function pickWhispers(n: number, seed: string): string[] {
  const rand = mulberry32(hashSeed(seed));
  const pool = [...RADAR_WHISPER_CHIPS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

function makeFigure(i: number, rand: () => number): RadarFloatItem {
  const tone: RadarFloatTone = i % 2 === 0 ? 'green' : 'violet';
  // Green faces read a touch smaller next to violet — bump them.
  const size = tone === 'green' ? 2.35 + rand() * 0.55 : 1.9 + rand() * 0.7;
  return {
    kind: 'figure',
    key: `figure-${i}`,
    size,
    tone,
  };
}

/**
 * Spots for every float item. Centre figure is fixed; arc items keep list order
 * around the ring (chip, anon, chip, anon, chip).
 */
export function arrangeFloatSpots(items: RadarFloatItem[], seed: string): RadarFloatSpot[] {
  const arc = items.filter((item) => !(item.kind === 'figure' && item.inner));
  const arcSpots = arrangeInArcOrder(arc.length, seed);
  let a = 0;

  return items.map((item) => {
    if (item.kind === 'figure' && item.inner) return innerSpot();
    return arcSpots[a++] ?? arcSpots[0] ?? innerSpot();
  });
}

/**
 * Build the arc as chip · anon · chip · anon · chip — never two chips next to
 * each other. One-chip case is anon · chip · anon. Centre face sits under the
 * green pulse separately.
 */
export function buildRadarFloatItems(vibeTags: VibeTag[]): RadarFloatItem[] {
  const rand = mulberry32(hashSeed(`sizes:${vibeTags.join('|') || 'void'}`));
  const chips = vibeTags.slice(0, RADAR_FLOAT_MAX_CHIPS);

  const labels: RadarFloatItem[] =
    chips.length > 0
      ? chips.map((tag, i) => ({
          kind: 'tag' as const,
          key: `tag-${tag}`,
          label: vibeTagLabel(tag),
          tone: (i % 2 === 0 ? 'violet' : 'green') as RadarFloatTone,
        }))
      : pickWhispers(RADAR_FLOAT_MAX_CHIPS, 'whispers:void').map((label, i) => ({
          kind: 'whisper' as const,
          key: `whisper-${i}`,
          label,
          tone: (i % 2 === 0 ? 'violet' : 'green') as RadarFloatTone,
        }));

  const ring: RadarFloatItem[] = [];
  if (labels.length === 1) {
    // Flank the lone chip so it isn't lonely and still has anons beside it.
    ring.push(makeFigure(0, rand), labels[0], makeFigure(1, rand));
  } else {
    // chip, anon, chip, anon, chip…
    for (let i = 0; i < labels.length; i++) {
      ring.push(labels[i]);
      if (i < labels.length - 1) ring.push(makeFigure(i, rand));
    }
  }

  return [
    { kind: 'figure', key: 'figure-inner', inner: true, size: 1.85, tone: 'violet' },
    ...ring,
  ];
}
