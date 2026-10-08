import { useForm, useController, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/features/auth';
import { MAX_DISPLAY_NAME_LENGTH } from '../constants';
import GenderPicker from './GenderPicker';
import TagPicker from './TagPicker';
import {
  joinQueueFormSchema,
  toJoinPayload,
  type JoinQueueFormValues,
} from '../utils/whisperValidators';
import type { JoinQueuePayload } from '../types';

type Props = {
  onJoin: (payload: JoinQueuePayload) => void;
  loading: boolean;
  error: string | null;
};

/**
 * The vibe form, split out so `VibePicker` is just the shell.
 *
 * One column, in the order it's answered: who you are → who you're looking for
 * → consent → go.
 */
export default function VibePickerForm({ onJoin, loading, error }: Props) {
  const signedIn = useAuthStore((s) => s.user !== null);
  const {
    control,
    register,
    handleSubmit: onFormSubmit,
    formState: { errors },
  } = useForm<JoinQueueFormValues>({
    // The Zod schema validates everything, including the 18+ gate — so there's
    // no second set of `register` rules or submit guard to drift out of sync.
    resolver: zodResolver(joinQueueFormSchema),
    mode: 'onChange',
    defaultValues: {
      displayName: '',
      gender: null,
      ageConfirmed: false,
      vibeTags: [],
    },
  });

  // `useWatch` (not `watch`) is safe under React Compiler's memoization.
  const displayName = useWatch({ control, name: 'displayName' });

  // These three drive custom controls (a pill group, a styled checkbox, a chip
  // grid) rather than native inputs, so they bind through `useController`
  // instead of `register` + `setValue`. `setValue` on an *unregistered* field
  // doesn't notify `useWatch`, which silently froze the whole form on its
  // initial state — the submit button could never enable. `useController`
  // registers the field, so the resolver actually validates these values too.
  const { field: genderField } = useController({ control, name: 'gender' });
  const { field: ageField } = useController({ control, name: 'ageConfirmed' });
  const { field: tagsField } = useController({ control, name: 'vibeTags' });

  const submit = (values: JoinQueueFormValues) => {
    onJoin(toJoinPayload(values));
  };

  return (
    <form onSubmit={onFormSubmit(submit)} className="flex flex-col gap-5">
      <div className="auth-field w-full text-left">
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="vp-name"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-body-700"
          >
            Your alias
          </label>
          <span className="text-[10px] text-body-700 tabular-nums">
            {displayName.length}/{MAX_DISPLAY_NAME_LENGTH}
          </span>
        </div>
        <input
          id="vp-name"
          type="text"
          autoComplete="off"
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          placeholder="NightOwl · CinemaGeek · QuietStorm"
          className="h-11 w-full rounded-xl border border-white/10 bg-black-dark/80 px-3.5 text-[15px] text-white outline-none placeholder:text-body-300/65 focus:border-green/55 focus:bg-black-dark focus:shadow-[0_0_0_3px_rgba(1,195,109,0.18)]"
          aria-invalid={Boolean(errors.displayName)}
          {...register('displayName')}
        />
        {errors.displayName && (
          <p className="mt-1.5 text-[11px] text-red">{errors.displayName.message}</p>
        )}
      </div>

      <GenderPicker value={genderField.value} onChange={genderField.onChange} />

      <TagPicker tags={tagsField.value} onChange={tagsField.onChange} />

      {/* 18+ gate — required, not decorative. Reads as one card with a real
          checked state rather than a checkbox floating in a bordered box. */}
      <label
        htmlFor="vp-age"
        className={[
          'group flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-200',
          ageField.value
            ? 'border-green/40 bg-green/[0.07]'
            : 'border-white/10 bg-black-dark/60 hover:border-white/20',
        ].join(' ')}
      >
        <input
          id="vp-age"
          type="checkbox"
          checked={ageField.value}
          onChange={(e) => ageField.onChange(e.target.checked)}
          aria-describedby="vp-age-hint"
          className="peer sr-only"
        />
        {/* Custom checkbox so the checked state matches the rest of the UI
            instead of the OS default. */}
        <span
          aria-hidden
          className={[
            'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] border transition-all duration-200',
            ageField.value
              ? 'border-green bg-green'
              : 'border-white/25 bg-black-dark group-hover:border-white/40',
          ].join(' ')}
        >
          {ageField.value && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0b1a12" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={[
              'block text-[13px] font-semibold leading-tight transition-colors',
              ageField.value ? 'text-green' : 'text-white',
            ].join(' ')}
          >
            I&apos;m 18 or older
          </span>
          <span
            id="vp-age-hint"
            className="mt-0.5 block text-[11px] leading-snug text-body-700"
          >
            Anonymous chat is adults only.
          </span>
        </span>
      </label>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red/20 bg-red/8 px-4 py-3 text-sm text-red"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2.5">
        <button
          type="submit"
          disabled={loading || !displayName.trim() || !ageField.value}
          className="whisper-cta relative w-full overflow-hidden rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span
                className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white motion-safe:animate-spin"
                aria-hidden
              />
              Finding your wavelength…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Enter the void
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          )}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-body-700">
          {/* Must not claim "No account" to someone who is signed in — the whisper
              layer carries their account for blocking, quota and cross-device
              state. The anonymity promise still holds, because the alias is what
              the partner sees, but "no account" would now be a lie. */}
          {signedIn
            ? 'Signed in · your alias stays anonymous to them · chats vanish when you leave'
            : 'No account · chats vanish when you leave · completely anonymous'}
        </p>
      </div>
    </form>
  );
}
