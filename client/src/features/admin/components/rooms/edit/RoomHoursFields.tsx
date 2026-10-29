import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { WEEKDAYS } from '../../../constants/rooms';
import type { RoomEditForm } from '../../../types';
import { inputClass } from './styles';

type Props = {
  register: UseFormRegister<RoomEditForm>;
  errors: FieldErrors<RoomEditForm>;
  enabled: boolean;
};

const RoomHoursFields = ({ register, errors, enabled }: Props) => (
  <fieldset className="flex flex-col gap-3 rounded-xl border border-border/40 bg-black-light/20 p-4">
    <legend className="px-1 text-xs font-medium text-body-300">Open hours</legend>
    <label className="flex items-center gap-2 text-sm text-body">
      <input type="checkbox" className="h-4 w-4 accent-green" {...register('hoursEnabled')} />
      Only open during set hours (otherwise always open)
    </label>
    {enabled && (
      <>
        <div className="flex flex-wrap gap-3" role="group" aria-label="Open days">
          {WEEKDAYS.map((day, i) => (
            <label key={day} className="flex items-center gap-1 text-xs text-body-300">
              <input type="checkbox" className="h-4 w-4 accent-green" value={String(i)} {...register('days')} />
              {day}
            </label>
          ))}
        </div>
        {errors.days && <p role="alert" className="text-xs text-red">{errors.days.message}</p>}
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-body-300">
            Start (HH:MM)
            <input {...register('start')} placeholder="18:00" className={inputClass} />
          </label>
          <label className="text-xs text-body-300">
            End (HH:MM)
            <input {...register('end')} placeholder="22:00" className={inputClass} />
          </label>
          <label className="col-span-2 text-xs text-body-300">
            Timezone (IANA)
            <input {...register('tz')} placeholder="Asia/Kolkata" className={inputClass} />
          </label>
        </div>
        {(errors.start ?? errors.end ?? errors.tz) && (
          <p role="alert" className="text-xs text-red">
            {(errors.start ?? errors.end ?? errors.tz)?.message}
          </p>
        )}
      </>
    )}
  </fieldset>
);

export default RoomHoursFields;
