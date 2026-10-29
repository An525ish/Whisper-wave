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
      <label className="rm-vis__opt">
        <input type="radio" value="public" {...register('visibility')} className="rm-vis__radio" />
        <span className="rm-vis__icon"><svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3Z" /></svg></span>
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
          className="rm-vis__radio"
        />
        <span className="rm-vis__icon"><svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg></span>
        <span>
          <span className="rm-vis__title">{ROOM_VISIBILITY_COPY.private.title}</span>
          <span className="rm-vis__sub">{ROOM_VISIBILITY_COPY.private.sub}</span>
        </span>
      </label>
      {blocked && <p className="rm-vis__note">{blocked}</p>}
      {(['public', 'private'] as const).map((k) => (
        <ul key={k} className={`rm-vis__facts rm-vis__facts--${k}`}>
          {ROOM_VISIBILITY_COPY[k].facts.map((f) => <li key={f}>{f}</li>)}
        </ul>
      ))}
    </fieldset>
  );
};

export default RoomVisibilityChoice;
