import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { selectableVisibilities } from '../../../constants/rooms';
import { roomEditSchema, roomToForm } from '../../../utils/rooms';
import type { AdminRoomRow, RoomEditForm as RoomEditValues } from '../../../types';
import RoomHoursFields from './RoomHoursFields';
import { inputClass } from './styles';

type Props = {
  room: AdminRoomRow;
  saving: boolean;
  onSave: (values: RoomEditValues) => void;
  onCancel: () => void;
};

/** Edits one template. Rules, hours and mods are always sent in full — the server overwrites them. */
const RoomEditForm = ({ room, saving, onSave, onCancel }: Props) => {
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
    <form onSubmit={handleSubmit(onSave)} className="mt-3 flex flex-col gap-3" aria-label={`Edit ${room.title}`}>
      <div className="grid gap-3 sm:grid-cols-2">
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

      <div>
        <label htmlFor={field('rules')} className="text-xs font-medium text-body-300">
          Rules (one per line, up to 10)
        </label>
        <textarea id={field('rules')} {...register('rulesText')} rows={4} className={inputClass} />
        {errors.rulesText && <p role="alert" className="mt-1 text-xs text-red">{errors.rulesText.message}</p>}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor={field('visibility')} className="text-xs font-medium text-body-300">Visibility</label>
          <select id={field('visibility')} {...register('visibility')} className={inputClass}>
            {selectableVisibilities(room.visibility).map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-body">
          <input type="checkbox" {...register('official')} />
          Official room
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-body">
          <input type="checkbox" {...register('requiresModPresence')} />
          Listening room (mod must be present)
        </label>
      </div>

      <RoomHoursFields register={register} errors={errors} enabled={hoursEnabled} />

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

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-3 py-1.5 text-xs text-body-300 hover:text-body">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-green/15 px-4 py-1.5 text-xs font-medium text-green hover:bg-green/25 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save room'}
        </button>
      </div>
    </form>
  );
};

export default RoomEditForm;
