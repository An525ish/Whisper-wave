import { useRef, type KeyboardEvent } from 'react';
import { GENDER_OPTIONS } from '../constants';
import type { Gender } from '../types';

type Props = {
  value: Gender | null;
  onChange: (g: Gender | null) => void;
};

/**
 * Gender — exclusive selection, expressed as a radio group.
 *
 * Tapping the selected option clears it, so "no answer" is reachable without a
 * separate Skip button: the field is optional, nothing selected IS the default.
 * Keyboard: one tab stop (the selected option, else the first); arrow keys move
 * and select, per the ARIA radio-group pattern.
 */
export default function GenderPicker({ value, onChange }: Props) {
  const groupRef = useRef<HTMLDivElement>(null);
  const tabStop = GENDER_OPTIONS.some((o) => o.value === value) ? value : GENDER_OPTIONS[0].value;

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
      : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1
      : 0;
    if (step === 0) return;
    e.preventDefault();
    const index = GENDER_OPTIONS.findIndex((o) => o.value === tabStop);
    const next = (index + step + GENDER_OPTIONS.length) % GENDER_OPTIONS.length;
    onChange(GENDER_OPTIONS[next].value);
    groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  };

  return (
    <fieldset>
      <legend className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-body-700">
        Gender
        <span className="rounded-full border border-white/[0.09] bg-white/[0.03] px-2 py-[3px] text-[10px] font-medium normal-case tracking-normal text-body-600">
          optional
        </span>
      </legend>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Gender"
        className="flex flex-wrap gap-2"
        onKeyDown={handleKey}
      >
        {GENDER_OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={opt.value === tabStop ? 0 : -1}
              onClick={() => onChange(active ? null : opt.value)}
              className={[
                'group flex items-center gap-2.5 rounded-full border px-4.5 py-2.5 text-[13.5px] font-semibold leading-none transition-all duration-200 ease-out active:scale-[0.97]',
                active
                  ? 'border-green/50 bg-green/[0.15] text-green shadow-[0_0_0_1px_rgba(1,195,109,0.14),0_3px_14px_-3px_rgba(1,195,109,0.4)]'
                  : 'border-white/[0.09] bg-white/[0.035] text-body-300 hover:-translate-y-px hover:border-green/35 hover:bg-green/[0.08] hover:text-white hover:shadow-[0_4px_14px_-4px_rgba(1,195,109,0.3)]',
              ].join(' ')}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                focusable="false"
                className={[
                  'shrink-0 transition-colors',
                  active
                    ? 'text-green'
                    : 'text-body-500 group-hover:text-green/80',
                ].join(' ')}
              >
                <circle
                  cx={opt.icon.circle.cx}
                  cy={opt.icon.circle.cy}
                  r={opt.icon.circle.r}
                />
                {opt.icon.paths.map((d) => (
                  <path key={d} d={d} />
                ))}
              </svg>
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
