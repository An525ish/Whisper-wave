import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useAuthStore } from '@/features/auth';
import { ROOM_RULE_SUGGESTIONS } from '../constants';
import { useCreateRoomMutation } from '../hooks/useRoomMutations';
import { suggestSlug } from '../utils/persona';
import { createRoomSchema, type CreateRoomForm } from '../utils/roomValidators';

/**
 * Create a user room. Unlisted until approved — creation never publishes,
 * and the sheet says so. The rules checkbox is the logged accept: the rules
 * array is stored on the template plus a creation analytics event.
 */
const CreateRoomSheet = () => {
  const user = useAuthStore((s) => s.user);
  const create = useCreateRoomMutation();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      rules: ROOM_RULE_SUGGESTIONS.map((value) => ({ value })),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'rules' });
  const title = watch('title');

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-10 text-center">
        <h1 className="font-display text-2xl text-white">Creating a room needs an account</h1>
        <p className="mt-2 text-sm text-body-300">
          Guests can join every room — but a public voice needs a name behind it.
        </p>
        <Link
          to={ROUTES.authLogin}
          className="mt-5 inline-block rounded-3xl bg-gradient-action-button-green px-6 py-2.5 text-sm font-medium text-body"
        >
          Sign in to create
        </Link>
      </main>
    );
  }

  const submit = (values: CreateRoomForm) => {
    create.mutate({
      slug: values.slug,
      title: values.title.trim(),
      description: values.description.trim(),
      rules: values.rules.map((r) => r.value.trim()).filter(Boolean),
      lang: 'en',
    });
  };

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-border/60 bg-white/[0.03] px-4 py-2.5 text-body outline-none placeholder:text-body-700 focus:border-green/50';
  const labelClass = 'text-sm font-medium text-body';
  const errorClass = 'mt-1 text-xs text-red';

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-8">
      <h1 className="font-display text-3xl text-white">New room</h1>
      <p className="mt-1 text-sm text-body-300">
        Live instantly, unlisted by default. Lobby listing needs approval — nothing you make goes public unseen.
      </p>

      <form onSubmit={handleSubmit(submit)} className="mt-5 flex flex-col gap-4">
        <div>
          <label htmlFor="room-title" className={labelClass}>Title</label>
          <input id="room-title" {...register('title')} maxLength={60} placeholder="e.g. Midnight Coding" className={inputClass} />
          {errors.title && <p role="alert" className={errorClass}>{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="room-slug" className={labelClass}>URL name</label>
          <div className="flex gap-2">
            <input id="room-slug" {...register('slug')} maxLength={40} placeholder="midnight-coding-x7k2" className={`${inputClass} min-w-0 flex-1`} />
            <button
              type="button"
              onClick={() => setValue('slug', suggestSlug(title), { shouldValidate: true })}
              className="shrink-0 rounded-xl border border-border/60 px-3 text-sm text-body-300 hover:text-body"
            >
              Suggest
            </button>
          </div>
          {errors.slug && <p role="alert" className={errorClass}>{errors.slug.message}</p>}
        </div>

        <div>
          <label htmlFor="room-desc" className={labelClass}>What is it about?</label>
          <textarea id="room-desc" {...register('description')} maxLength={280} rows={2} placeholder="Who is it for, what happens here" className={inputClass} />
          {errors.description && <p role="alert" className={errorClass}>{errors.description.message}</p>}
        </div>

        <div>
          <span className={labelClass}>House rules</span>
          <div className="mt-1.5 flex flex-col gap-2">
            {fields.map((field, i) => (
              <div key={field.id} className="flex gap-2">
                <input
                  {...register(`rules.${i}.value`)}
                  maxLength={140}
                  aria-label={`Rule ${i + 1}`}
                  className={`${inputClass} mt-0 min-w-0 flex-1`}
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label={`Remove rule ${i + 1}`}
                    className="shrink-0 px-2 text-body-300 hover:text-body"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.rules && <p role="alert" className={errorClass}>{errors.rules.message as string}</p>}
          {fields.length < 6 && (
            <button
              type="button"
              onClick={() => append({ value: '' })}
              className="mt-2 text-sm font-medium text-green hover:underline"
            >
              + Add a rule
            </button>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border/60 bg-white/[0.03] p-4 text-sm leading-relaxed text-body-300">
          <input type="checkbox" {...register('accept')} className="mt-1 accent-green" />
          I’ll host this room — enforce these rules, act on reports fast, and I understand
          abusive rooms get closed and banned without warning.
        </label>
        {errors.accept && <p role="alert" className={errorClass}>{errors.accept.message}</p>}

        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-3xl bg-gradient-action-button-green px-5 py-3 text-sm font-semibold text-body transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {create.isPending ? 'Creating…' : 'Create room'}
        </button>
      </form>
    </main>
  );
};

export default CreateRoomSheet;
