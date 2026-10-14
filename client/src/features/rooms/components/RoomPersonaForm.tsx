import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROOM_LIMITS } from '../constants';
import { defaultColor } from '../utils/persona';
import { failCopy } from '../utils/roomErrors';
import { initialOf } from '../utils/art';
import { roomAliasSchema } from '../utils/roomValidators';
import type { RoomAckCode, RoomAliasForm, RoomsPersona, RoomSocketStatus } from '../types';
import RoomSwatchPicker from './RoomSwatchPicker';

type Props = {
  /** Prefill: the one persona (Whisper alias + rooms color). */
  persona: RoomsPersona | null;
  connection: RoomSocketStatus;
  joining: boolean;
  /** Why the last knock was refused — shown inline. */
  joinError: RoomAckCode | null;
  onJoin: (params: RoomsPersona) => void;
  onKnockChange: (knocking: boolean) => void;
};

const CONNECTION_COPY = {
  connecting: 'Connecting to the room…',
  offline: 'You’re offline — reconnecting…',
} as const;

/** Pick a name and color, then knock. Disabled until the socket is up and while a join is pending. */
const RoomPersonaForm = ({ persona, connection, joining, joinError, onJoin, onKnockChange }: Props) => {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<RoomAliasForm>({
    resolver: zodResolver(roomAliasSchema),
    defaultValues: {
      alias: persona?.alias ?? '',
      color: persona?.color ?? defaultColor(persona?.alias ?? 'you'),
    },
  });
  const color = useWatch({ control, name: 'color' });
  const alias = useWatch({ control, name: 'alias' });
  const previewAlias = alias.trim() || 'Your alias';
  const previewColor = color ?? defaultColor(alias);
  const online = connection === 'online';

  const submit = (values: RoomAliasForm) => {
    if (!online || joining) return;
    onJoin({ alias: values.alias.trim(), color: values.color ?? defaultColor(values.alias) });
  };

  return (
    <section aria-label="Choose your presence" className="rm-persona">
      <div className="rm-persona__preview" aria-hidden>
        <span
          className="rm-persona__avatar"
          style={{ color: previewColor, backgroundColor: `${previewColor}1f`, borderColor: `${previewColor}55` }}
        >
          {initialOf(alias)}
        </span>
        <span className="rm-persona__who">
          <p>They’ll know you as</p>
          <p style={{ color: previewColor }}>{previewAlias}</p>
        </span>
      </div>

      <form onSubmit={handleSubmit(submit)}>
        <label htmlFor="room-alias" className="rm-field">
          Your name in here
        </label>
        <input
          id="room-alias"
          {...register('alias')}
          placeholder="e.g. NightOwl"
          autoComplete="off"
          maxLength={ROOM_LIMITS.ALIAS_MAX}
          className="rm-input"
        />
        {errors.alias && <p role="alert" className="rm-error">{errors.alias.message}</p>}

        <span id="room-color-label" className="rm-field">
          Your color
        </span>
        <RoomSwatchPicker
          value={color}
          onChange={(hex) => setValue('color', hex, { shouldValidate: true })}
          labelledBy="room-color-label"
        />

        {joinError && <p role="alert" className="rm-joinerr">{failCopy(joinError)}</p>}

        <button
          type="submit"
          className="rm-joinbtn"
          disabled={!online || joining}
          onMouseEnter={() => onKnockChange(true)}
          onMouseLeave={() => onKnockChange(false)}
          onFocus={() => onKnockChange(true)}
          onBlur={() => onKnockChange(false)}
        >
          {joining ? 'Knocking…' : 'Knock and enter'}
          <span aria-hidden>→</span>
        </button>
        {connection !== 'online' ? (
          <p className="rm-joinhint" role="status">{CONNECTION_COPY[connection]}</p>
        ) : (
          <p className="rm-joinhint">They’ll only ever know you as {previewAlias}.</p>
        )}
      </form>
    </section>
  );
};

export default RoomPersonaForm;
