import { useState, type KeyboardEvent } from 'react';
import {
  ALL_VIBE_TAGS,
  MAX_TAGS,
  VISIBLE_PRESETS,
} from '../constants';
import { normalizeVibeTag, vibeTagLabel } from '../utils/vibeTag';
import type { VibeTag } from '../types';

type Props = {
  tags: VibeTag[];
  onChange: (next: VibeTag[]) => void;
};

/**
 * The vibe tag pill input: type custom tags (capped at `MAX_TAGS`) or pick from
 * presets. Free-text tags are a documented deviation from a fixed list — the
 * server canonicalises them.
 */
export default function TagPicker({ tags, onChange }: Props) {
  const [custom, setCustom] = useState('');
  const [showAll, setShowAll] = useState(false);
  const full = tags.length >= MAX_TAGS;

  const addTag = (raw: string) => {
    const tag = normalizeVibeTag(raw);
    if (!tag || tags.includes(tag) || tags.length >= MAX_TAGS) return;
    onChange([...tags, tag]);
  };

  const removeTag = (tag: VibeTag) => onChange(tags.filter((t) => t !== tag));

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(custom);
      setCustom('');
    } else if (e.key === 'Backspace' && !custom && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const visible = showAll ? ALL_VIBE_TAGS : ALL_VIBE_TAGS.slice(0, VISIBLE_PRESETS);
  const hiddenCount = ALL_VIBE_TAGS.length - VISIBLE_PRESETS;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-body-700">
          Vibes
        </span>
        <span
          className="text-[10px] font-medium tabular-nums transition-colors"
          style={{ color: full ? 'var(--color-green)' : 'rgba(235,236,236,0.28)' }}
        >
          {tags.length}/{MAX_TAGS}
        </span>
      </div>

      {/* Selected tags + free-text input. The field shows a "full" state rather
          than just disappearing the input, so the control never jumps. */}
      <div
        className={[
          'flex min-h-[46px] flex-wrap items-center gap-1.5 rounded-xl border bg-black-dark/80 px-3 py-2 transition-all duration-200',
          full
            ? 'border-green/30 bg-green/[0.04]'
            : 'border-white/10 focus-within:border-green/55 focus-within:bg-black-dark focus-within:shadow-[0_0_0_3px_rgba(1,195,109,0.18)]',
        ].join(' ')}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex shrink-0 items-center gap-1 rounded-full border border-green/35 bg-green/[0.13] py-[3px] pl-2.5 pr-1 text-[11.5px] font-medium leading-none text-green"
          >
            {vibeTagLabel(tag)}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="grid h-4 w-4 place-items-center rounded-full text-[13px] leading-none text-green/60 transition-colors hover:bg-green/20 hover:text-green"
              aria-label={`Remove ${vibeTagLabel(tag)}`}
            >
              ×
            </button>
          </span>
        ))}

        {full ? (
          <span className="pl-1 text-[11px] leading-none text-body-700">
            That&apos;s your {MAX_TAGS} — remove one to swap.
          </span>
        ) : (
          <input
            type="text"
            aria-label="Add a vibe tag"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              tags.length === 0 ? 'Type a vibe, or pick below…' : 'Add one more…'
            }
            className="min-w-[150px] flex-1 bg-transparent text-sm text-white placeholder:text-body-300/50 outline-none"
          />
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {visible.map((tag) => {
          const active = tags.includes(tag);
          const disabled = !active && full;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => (active ? removeTag(tag) : addTag(tag))}
              disabled={disabled}
              aria-pressed={active}
              className={[
                // Slight vertical lift + saturation on hover so the row feels
                // alive rather than being a static list of pills.
                'group rounded-full px-3 py-[7px] text-[11.5px] font-medium leading-none tracking-[0.01em] transition-all duration-200 ease-out active:scale-[0.97]',
                active
                  ? 'border border-green/45 bg-green/[0.14] text-green shadow-[0_0_0_1px_rgba(1,195,109,0.12),0_2px_10px_-2px_rgba(1,195,109,0.3)]'
                  : disabled
                    ? 'cursor-not-allowed border border-white/[0.05] bg-transparent text-body-700 opacity-30'
                    : 'border border-white/[0.09] bg-white/[0.035] text-body-400 hover:-translate-y-px hover:border-green/35 hover:bg-green/[0.08] hover:text-body-100 hover:shadow-[0_3px_12px_-4px_rgba(1,195,109,0.28)]',
              ].join(' ')}
            >
              {vibeTagLabel(tag)}
            </button>
          );
        })}

        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            aria-expanded={showAll}
            className="rounded-full border border-dashed border-white/[0.12] bg-transparent px-3 py-[7px] text-[11.5px] font-medium leading-none text-body-600 transition-all duration-200 hover:border-white/25 hover:text-body-300"
          >
            {showAll ? '↑ less' : `+${hiddenCount} more`}
          </button>
        )}
      </div>
    </div>
  );
}
