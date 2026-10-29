import { useState, type FormEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useAuthStore } from '@/features/auth';
import AmbientBackdrop from '@/shared/components/ui/backdrop/AmbientBackdrop';
import BokehCrowd from '@/shared/components/ui/backdrop/BokehCrowd';
import ChevronLeftIcon from '@/shared/components/ui/icons/ChevronLeft';
import CheckStrokeIcon from '@/shared/components/ui/icons/CheckStroke';
import { ROOM_DEFAULT_LANG, ROOM_RULE_SUGGESTIONS } from '../constants';
import { useCreateRoomMutation } from '../hooks/useRoomMutations';
import { useMyRoomsQuery } from '../hooks/useRoomsQueries';
import { suggestSlug } from '../utils/persona';
import { createRoomSchema } from '../utils/roomValidators';
import type { CreateRoomForm } from '../types';
import CreateRoomPreview from './CreateRoomPreview';
import { DetailsStep, RulesStep } from './CreateRoomSteps';
import RoomVisibilityChoice from './RoomVisibilityChoice';
import './roomsBackdrop.css';
import './createRoom.css';

const STEPS = [
  { label: 'Access', title: 'Who can come in?', sub: 'Pick how people find your room.', fields: [] },
  { label: 'Details', title: 'Give it a name', sub: 'A title, a link and a line about it.', fields: ['title', 'slug', 'description'] },
  { label: 'Rules', title: 'Set the rules', sub: 'People see these before they join.', fields: ['rules'] },
] as const;

/**
 * Create a user room in three steps with the gate building itself beside the
 * form. Public rooms are unlisted until approved (creation never publishes);
 * private rooms are invite-only and entitlement-gated. The host checkbox is the
 * logged accept: the rules are stored on the template plus an analytics event.
 */
const CreateRoomSheet = () => {
  const user = useAuthStore((s) => s.user);
  const create = useCreateRoomMutation();
  const mine = useMyRoomsQuery(Boolean(user));
  const [step, setStep] = useState(0);

  const form = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      visibility: 'public',
      rules: ROOM_RULE_SUGGESTIONS.map((value) => ({ value })),
    },
  });
  const { control, register, handleSubmit, trigger, getValues, setValue } = form;
  const title = useWatch({ control, name: 'title' });
  const slug = useWatch({ control, name: 'slug' });
  const description = useWatch({ control, name: 'description' });
  const visibility = useWatch({ control, name: 'visibility' });
  const rules = useWatch({ control, name: 'rules' });

  if (!user) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-10 text-center">
        <h1 className="font-display text-2xl text-white">Creating a room needs an account</h1>
        <p className="mt-2 text-sm text-body-300">
          Guests can join every room. Hosting needs an account.
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
      lang: ROOM_DEFAULT_LANG,
      rulesAccepted: true,
      visibility: values.visibility,
    });
  };

  const last = step === STEPS.length - 1;
  const next = async () => {
    // Leaving the details step with no link name yet: fill one in from the title.
    if (step === 1 && !getValues('slug').trim()) setValue('slug', suggestSlug(getValues('title')));
    if (await trigger([...STEPS[step].fields])) setStep((s) => s + 1);
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Enter inside a field moves on; only the last step creates the room.
    if (last) void handleSubmit(submit)(e);
    else void next();
  };

  const current = STEPS[step];

  return (
    <div className="rm-page cr-page">
      <AmbientBackdrop className="rm-bg" green={false}>
        <BokehCrowd />
      </AmbientBackdrop>

      <main className="cr-wrap">
        <Link to={ROUTES.rooms} className="rm-backlink">
          <ChevronLeftIcon /> Rooms
        </Link>

        <div className="cr-grid">

          <section className="cr-panel" aria-label="New room">
            <ol className="cr-steps">
              {STEPS.map((s, i) => (
                <li key={s.label} className={i === step ? 'is-now' : i < step ? 'is-done' : ''} aria-current={i === step ? 'step' : undefined}>
                  <span className="cr-steps__dot">{i < step ? <CheckStrokeIcon /> : i + 1}</span>
                  {s.label}
                </li>
              ))}
            </ol>

            <p className="cr-eyebrow">Step {step + 1} of {STEPS.length}</p>
            <h1 className="cr-title">{current.title}</h1>
            <p className="cr-lead">{current.sub}</p>

            <form onSubmit={onSubmit} className="cr-form" noValidate>
              <div className="cr-body">
                {step === 0 && <RoomVisibilityChoice register={register} capability={mine.data?.privateRooms} />}
                {step === 1 && <DetailsStep form={form} />}
                {step === 2 && <RulesStep form={form} />}
              </div>

              <div className="cr-actions">
                {step > 0 ? (
                  <button type="button" onClick={() => setStep((s) => s - 1)} className="cr-ghost">
                    Back
                  </button>
                ) : (
                  <span />
                )}
                <button type="submit" disabled={create.isPending} className="cr-next">
                  {last ? (create.isPending ? 'Creating…' : 'Create room') : 'Continue'}
                  <span aria-hidden>→</span>
                </button>
              </div>
            </form>
          </section>

          <CreateRoomPreview
            title={title}
            slug={slug}
            description={description}
            rules={rules.map((r) => r.value)}
            visibility={visibility}
            step={step}
          />
        </div>
      </main>
    </div>
  );
};

export default CreateRoomSheet;
