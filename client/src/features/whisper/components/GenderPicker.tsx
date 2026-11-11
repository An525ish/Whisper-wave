import { useRef, type KeyboardEvent } from 'react';
import { GENDER_OPTIONS } from '../constants';
import type { Gender, PreferGender } from '../types';

type GenderOption = (typeof GENDER_OPTIONS)[number];

const PILL_BASE =
  'group flex min-w-0 items-center justify-center gap-1 rounded-full border px-1.5 py-2 text-[12px] font-semibold leading-none transition-all duration-200 ease-out active:scale-[0.97] sm:gap-2 sm:px-3 sm:py-2.5 sm:text-[13px]';

const PILL_COMPACT =
  'group flex min-w-0 flex-row items-center justify-center gap-1 rounded-full border px-1 py-2 transition-all duration-200 ease-out active:scale-[0.97] sm:gap-1.5 sm:px-1.5 sm:py-2.5';

const PREFER_LETTER: Record<GenderOption['value'], string> = {
  female: 'F',
  male: 'M',
  other: 'O',
};

const pillState = (active: boolean) =>
  active
    ? 'border-green/50 bg-green/[0.15] text-green shadow-[0_0_0_1px_rgba(1,195,109,0.14),0_2px_10px_-3px_rgba(1,195,109,0.35)]'
    : 'border-white/[0.09] bg-white/[0.035] text-body-300 hover:border-green/35 hover:bg-green/[0.08] hover:text-white';

function AnyoneSymbol({ active }: { active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={[
        'h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4',
        active ? 'text-green' : 'text-body-500 group-hover:text-green/80',
      ].join(' ')}
    >
      <path d="M16 3h5v5" />
      <path d="M21 3l-7 7" />
      <path d="M8 21H3v-5" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

function GenderSymbol({ opt, active }: { opt: GenderOption; active: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={[
        'h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4',
        active ? 'text-green' : 'text-body-500 group-hover:text-green/80',
      ].join(' ')}
    >
      <circle cx={opt.icon.circle.cx} cy={opt.icon.circle.cy} r={opt.icon.circle.r} />
      {opt.icon.paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

type Props = {
  /** Required before join. Stored on your card so others can be matched fairly. */
  value: Gender | null;
  onChange: (g: Gender) => void;
  genderError?: string;
  /** Spark Pass only: who you want to meet. Free users stay random. */
  prefer: PreferGender | null;
  onPreferChange: (g: PreferGender | null) => void;
  hasPass: boolean;
};

/**
 * Your gender (required) plus, for pass holders, who you want to meet in the same block.
 * Two different questions: "who you are" vs "who you want". One field cannot stand in for both.
 */
export default function GenderPicker({
  value,
  onChange,
  genderError,
  prefer,
  onPreferChange,
  hasPass,
}: Props) {
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

  const anyoneActive = prefer === null;

  return (
    <fieldset>
      <legend className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-body-700">
        Your gender
      </legend>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label="Your gender"
        aria-invalid={Boolean(genderError)}
        className="grid grid-cols-3 gap-1.5 sm:gap-2"
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
              onClick={() => onChange(opt.value)}
              className={`${PILL_BASE} sm:gap-2.5 sm:px-4.5 sm:text-[13.5px] ${pillState(active)}`}
            >
              <GenderSymbol opt={opt} active={active} />
              {opt.label}
            </button>
          );
        })}
      </div>
      {genderError && <p className="mt-1.5 text-[11px] text-red">{genderError}</p>}

      {hasPass && (
        <div className="mt-4">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-body-700">
            Want to meet
          </p>
          <div
            role="radiogroup"
            aria-label="Who you want to meet"
            className="grid grid-cols-4 gap-1 sm:gap-1.5"
          >
            <button
              type="button"
              role="radio"
              aria-checked={anyoneActive}
              aria-label="Anyone"
              onClick={() => onPreferChange(null)}
              className={`${PILL_COMPACT} ${pillState(anyoneActive)}`}
            >
              <AnyoneSymbol active={anyoneActive} />
              <span className="text-[11px] font-bold leading-none sm:text-xs">Any</span>
            </button>
            {GENDER_OPTIONS.map((opt) => {
              const active = prefer === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={opt.label}
                  onClick={() => onPreferChange(active ? null : opt.value)}
                  className={`${PILL_COMPACT} ${pillState(active)}`}
                >
                  <GenderSymbol opt={opt} active={active} />
                  <span className="text-[11px] font-bold leading-none sm:text-xs">
                    {PREFER_LETTER[opt.value]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </fieldset>
  );
}
