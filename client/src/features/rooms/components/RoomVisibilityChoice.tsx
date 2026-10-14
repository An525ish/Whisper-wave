import type { UseFormRegister } from 'react-hook-form';
import { ROOM_VISIBILITY_COPY } from '../constants';
import type { CreateRoomForm, MyRoomsData } from '../types';
import './roomPrivate.css';

type Props = {
  register: UseFormRegister<CreateRoomForm>;
  /** From `GET /rooms/mine`; undefined while loading or if it failed (private stays off until known). */
  capability: MyRoomsData['privateRooms'] | undefined;
};

/** Why private is unavailable right now, or null when it can be picked. */
const blockedReason = (capability: Props['capability']): string | null => {
  if (!capability) return 'Checking whether private rooms are available to you…';
  if (capability.eligibility === 'flag_off') return ROOM_VISIBILITY_COPY.flag_off;
  if (capability.eligibility === 'not_entitled') return ROOM_VISIBILITY_COPY.not_entitled;
  if (capability.active >= capability.limit) return ROOM_VISIBILITY_COPY.limit;
  return null;
};

/** The two-way room kind choice on the create sheet, with plain-language explanations. */
const RoomVisibilityChoice = ({ register, capability }: Props) => {
  const blocked = blockedReason(capability);
  return (
    <fieldset className="rm-vis">
      <legend className="text-sm font-medium text-body">Who can find it?</legend>
      <label className="rm-vis__opt mt-1.5">
        <input type="radio" value="public" {...register('visibility')} className="mt-1 accent-green" />
        <span>
          <span className="rm-vis__title">{ROOM_VISIBILITY_COPY.public.title}</span>
          <span className="rm-vis__sub">{ROOM_VISIBILITY_COPY.public.sub}</span>
        </span>
      </label>
      <label className={`rm-vis__opt${blocked ? ' rm-vis__opt--off' : ''}`}>
        <input
          type="radio"
          value="private"
          disabled={blocked !== null}
          {...register('visibility')}
          className="mt-1 accent-green"
        />
        <span>
          <span className="rm-vis__title">{ROOM_VISIBILITY_COPY.private.title}</span>
          <span className="rm-vis__sub">{ROOM_VISIBILITY_COPY.private.sub}</span>
          {blocked && <span className="rm-vis__note">{blocked}</span>}
        </span>
      </label>
    </fieldset>
  );
};

export default RoomVisibilityChoice;
