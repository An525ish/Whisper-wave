import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import EmptyState from '@/shared/components/ui/EmptyState';
import { ROOM_ALIAS_COLORS } from '../constants';
import { useRoomInfo } from '../hooks/useRoomsQueries';
import { defaultColor, readRoomsPersona } from '../utils/persona';
import { roomAliasSchema, type RoomAliasForm } from '../utils/roomValidators';

type Props = {
  slug: string;
  invite?: string;
  onJoin: (params: { alias: string; color: string }) => void;
};

/**
 * Pre-join sheet: what the room is, its rules, who you'll be in it.
 * Joining from here is the only entry — the socket never sends a persona
 * the user hasn't seen and confirmed.
 */
const RoomRulesSheet = ({ slug, invite, onJoin }: Props) => {
  const { data: room, isLoading, isError } = useRoomInfo(slug, invite);
  const stored = readRoomsPersona();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoomAliasForm>({
    resolver: zodResolver(roomAliasSchema),
    defaultValues: {
      alias: stored?.alias ?? '',
      color: stored?.color ?? defaultColor(stored?.alias ?? 'you'),
    },
  });
  const color = watch('color');

  const submit = (values: RoomAliasForm) => {
    onJoin({ alias: values.alias.trim(), color: values.color ?? defaultColor(values.alias) });
  };

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-10">
        <div aria-label="Loading room" className="h-48 animate-pulse rounded-2xl bg-white/5 motion-reduce:animate-none" />
      </main>
    );
  }

  if (isError || !room) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-10">
        <EmptyState
          title="Room not found"
          description="It may have been removed — or the link is wrong."
          action={
            <Link to={ROUTES.rooms} className="font-medium text-green hover:underline">
              Browse rooms
            </Link>
          }
        />
      </main>
    );
  }

  if (!room.open) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-10">
        <EmptyState
          title={`${room.title} is closed right now`}
          description="Some rooms keep hours — check back later."
          action={
            <Link to={ROUTES.rooms} className="font-medium text-green hover:underline">
              Browse rooms
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-8">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-body-300">
        {room.official ? 'Official room' : 'Community room'}
      </p>
      <h1 className="mt-1 font-display text-3xl text-white">{room.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-body-300">{room.description}</p>

      <section aria-label="Room rules" className="mt-5 rounded-2xl border border-border/60 bg-white/[0.03] p-5">
        <h2 className="text-sm font-semibold text-white">House rules</h2>
        <ul className="mt-2 flex flex-col gap-1.5">
          {room.rules.map((rule) => (
            <li key={rule} className="text-sm leading-relaxed text-body-300">
              · {rule}
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={handleSubmit(submit)} className="mt-5 flex flex-col gap-3">
        <div>
          <label htmlFor="room-alias" className="text-sm font-medium text-body">
            Your name in here
          </label>
          <input
            id="room-alias"
            {...register('alias')}
            placeholder="e.g. NightOwl"
            autoComplete="off"
            maxLength={24}
            className="mt-1.5 w-full rounded-xl border border-border/60 bg-white/[0.03] px-4 py-2.5 text-body outline-none placeholder:text-body-700 focus:border-green/50"
          />
          {errors.alias && <p role="alert" className="mt-1 text-xs text-red">{errors.alias.message}</p>}
        </div>

        <div>
          <span id="room-color-label" className="text-sm font-medium text-body">Your color</span>
          <div role="radiogroup" aria-labelledby="room-color-label" className="mt-1.5 flex gap-2">
            {ROOM_ALIAS_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={color === c}
                aria-label={`Color ${c}`}
                onClick={() => setValue('color', c, { shouldValidate: true })}
                style={{ backgroundColor: c }}
                className={`h-8 w-8 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green ${
                  color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : 'opacity-60 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 rounded-3xl bg-gradient-action-button-green px-5 py-3 text-sm font-semibold text-body transition-opacity hover:opacity-90"
        >
          Join {room.title}
        </button>
      </form>
    </main>
  );
};

export default RoomRulesSheet;
