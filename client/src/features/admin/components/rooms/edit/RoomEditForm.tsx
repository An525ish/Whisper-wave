import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROOM_MEDIA_KINDS, selectableVisibilities } from '../../../constants/rooms';
import { roomEditSchema, roomToForm } from '../../../utils/rooms';
import type { AdminRoomRow, RoomEditForm as RoomEditValues } from '../../../types';
import RoomHoursFields from './RoomHoursFields';
import { inputClass } from './styles';

type Props = {
  room: AdminRoomRow;
  /** Lets a submit button outside the form (the panel footer) trigger it. */
  formId: string;
  onSave: (values: RoomEditValues) => void;
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-white/[0.02] p-4">
    <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-body-300">{title}</h3>
    {children}
  </section>
);

/** Edits one template. Rules, hours and mods are always sent in full — the server overwrites them. */
const RoomEditForm = ({ room, formId, onSave }: Props) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RoomEditValues>({
    resolver: zodResolver(roomEditSchema),
    defaultValues: roomToForm(room),
  });
  const hoursEnabled = useWatch({ control, name: 'hoursEnabled' });
  const id = `room-edit-${room.slug}`;
  const field = (name: string) => `${id}-${name}`;

  return (
    <form id={formId} onSubmit={handleSubmit(onSave)} className="flex flex-col gap-4" aria-label={`Edit ${room.title}`}>
      <Section title="Basics">
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <div>
          <label htmlFor={field('title')} className="text-xs font-medium text-body-300">Title</label>
          <input id={field('title')} {...register('title')} maxLength={60} className={inputClass} />
          {errors.title && <p role="alert" className="mt-1 text-xs text-red">{errors.title.message}</p>}
        </div>
        <div>
          <label htmlFor={field('lang')} className="text-xs font-medium text-body-300">Language</label>
          <input id={field('lang')} {...register('lang')} maxLength={20} className={inputClass} />
          {errors.lang && <p role="alert" className="mt-1 text-xs text-red">{errors.lang.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor={field('desc')} className="text-xs font-medium text-body-300">Description</label>
        <textarea id={field('desc')} {...register('description')} rows={2} maxLength={280} className={inputClass} />
        {errors.description && <p role="alert" className="mt-1 text-xs text-red">{errors.description.message}</p>}
      </div>
      </Section>

      <Section title="Rules and media">

      <div>
        <label htmlFor={field('rules')} className="text-xs font-medium text-body-300">
          Rules (one per line, up to 10)
        </label>
        <textarea id={field('rules')} {...register('rulesText')} rows={4} className={inputClass} />
        {errors.rulesText && <p role="alert" className="mt-1 text-xs text-red">{errors.rulesText.message}</p>}
      </div>

      <fieldset>
        <legend className="text-xs font-medium text-body-300">Media members can post (guests are text only)</legend>
        <div className="mt-1 flex gap-4">
          {ROOM_MEDIA_KINDS.map((kind) => (
            <label key={kind} className="flex items-center gap-2 text-sm text-body">
              <input type="checkbox" className="h-4 w-4 accent-green" value={kind} {...register('media')} />
              {kind === 'image' ? 'Photos' : kind === 'gif' ? 'GIFs' : 'Memes'}
            </label>
          ))}
        </div>
      </fieldset>

      </Section>

      <Section title="Access">
        <div>
          <label htmlFor={field('visibility')} className="text-xs font-medium text-body-300">Visibility</label>
          <select id={field('visibility')} {...register('visibility')} className={inputClass}>
            {selectableVisibilities(room.visibility).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-body">
          <input type="checkbox" className="h-4 w-4 accent-green" {...register('official')} />
          Official room
        </label>
        <label className="flex items-center gap-2 text-sm text-body">
          <input type="checkbox" className="h-4 w-4 accent-green" {...register('requiresModPresence')} />
          Listening room (mod must be present)
        </label>
      </Section>

      <RoomHoursFields register={register} errors={errors} enabled={hoursEnabled} />

      <Section title="Moderators">
      <div>
        <label htmlFor={field('mods')} className="text-xs font-medium text-body-300">
          Mod user ids (comma separated)
        </label>
        <input id={field('mods')} {...register('modsText')} placeholder="64f0…, 64f1…" className={`${inputClass} font-mono`} />
        {room.mods.some((m) => m.username) && (
          <p className="mt-1 text-xs text-body-300">
            Current: {room.mods.map((m) => m.username ?? 'unknown account').join(', ')}
          </p>
        )}
        {errors.modsText && <p role="alert" className="mt-1 text-xs text-red">{errors.modsText.message}</p>}
      </div>
      </Section>
    </form>
  );
};

export default RoomEditForm;
