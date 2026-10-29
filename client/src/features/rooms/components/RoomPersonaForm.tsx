import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/features/auth';
import Image from '@/shared/components/ui/Image';
import { resolveAvatarSrc } from '@/shared/utils/helpers';
import { ROOM_ALIAS_SWATCHES, ROOM_LIMITS } from '../constants';
import { defaultColor } from '../utils/persona';
import { failCopy } from '../utils/roomErrors';
import { initialOf } from '../utils/art';
import { roomAliasSchema } from '../utils/roomValidators';
import type { RoomAckCode, RoomAliasForm, RoomsPersona, RoomSocketStatus } from '../types';
import RoomSwatchPicker from './RoomSwatchPicker';
import './roomPersona.css';

type Props = {
  /** Prefill: the one persona (Whisper alias + rooms color). */
  persona: RoomsPersona | null;
  connection: RoomSocketStatus;
  joining: boolean;
  /** Why the last knock was refused — shown inline. */
  joinError: RoomAckCode | null;
  onJoin: (params: RoomsPersona & { useAvatar?: boolean }) => void;
  onKnockChange: (knocking: boolean) => void;
};

const CONNECTION_COPY = {
  connecting: 'Connecting to the room…',
  offline: 'You’re offline. Reconnecting…',
} as const;

/** Pick a name and color, then join. Disabled until the socket is up and while a join is pending. */
const RoomPersonaForm = ({ persona, connection, joining, joinError, onJoin, onKnockChange }: Props) => {
  const user = useAuthStore((s) => s.user);
  const accountName = user?.username?.slice(0, ROOM_LIMITS.ALIAS_MAX) ?? '';
  // Signed in: skip the form. Join as my account (name + photo); a small link opens the form instead.
  const [custom, setCustom] = useState(false);
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
  const previewColor = color ?? defaultColor(alias);
  const colorName = ROOM_ALIAS_SWATCHES.find((sw) => sw.hex === previewColor)?.name;
  const online = connection === 'online';

  const submit = (values: RoomAliasForm) => {
    if (!online || joining) return;
    onJoin({ alias: values.alias.trim(), color: values.color ?? defaultColor(values.alias) });
  };

  if (user && accountName && !custom) {
    const photo = resolveAvatarSrc(user.avatar as Parameters<typeof resolveAvatarSrc>[0]);
    const color = persona?.color ?? defaultColor(accountName);
    return (
      <section aria-label="Join as yourself" className="rm-persona" style={{ '--pc': color } as React.CSSProperties}>
        <div className="rm-me">
          <span className={`rm-me__avatar${photo ? ' rm-me__avatar--photo' : ''}`}>
            {photo ? (
              <Image src={photo} alt="" className="h-full w-full rounded-full object-cover" displayWidth={112} showLoading={false} />
            ) : (
              initialOf(accountName)
            )}
          </span>
          <div className="rm-me__text">
            <p className="rm-me__label">Joining as</p>
            <p className="rm-me__name">{accountName}</p>
          </div>
          <button type="button" className="rm-me__change" onClick={() => setCustom(true)}>
            Change name
          </button>
        </div>

        {joinError && <p role="alert" className="rm-joinerr">{failCopy(joinError)}</p>}

        <button
          type="button"
          className="rm-joinbtn"
          disabled={!online || joining}
          onClick={() => onJoin({ alias: accountName, color, useAvatar: true })}
          onMouseEnter={() => onKnockChange(true)}
          onMouseLeave={() => onKnockChange(false)}
          onFocus={() => onKnockChange(true)}
          onBlur={() => onKnockChange(false)}
        >
          {joining ? 'Joining…' : 'Join room'}
          <span aria-hidden>→</span>
        </button>
        {connection !== 'online' && <p className="rm-joinhint" role="status">{CONNECTION_COPY[connection]}</p>}
      </section>
    );
  }

  return (
    <section aria-label="Choose your presence" className="rm-persona">
      <form onSubmit={handleSubmit(submit)} style={{ '--pc': previewColor } as React.CSSProperties}>
        <div className="rm-steprow">
          <span aria-hidden className="rm-steprow__num">1</span>
          <div className="rm-steprow__body">
            <label htmlFor="room-alias" className="rm-step">Pick a name</label>
            <div className="rm-namefield">
              <span aria-hidden className="rm-namefield__avatar">{initialOf(alias)}</span>
              <input
                id="room-alias"
                {...register('alias')}
                placeholder="e.g. NightOwl"
                autoComplete="off"
                maxLength={ROOM_LIMITS.ALIAS_MAX}
                className="rm-namefield__input"
              />
              <span aria-hidden className="rm-namefield__count">
                {alias.length}/{ROOM_LIMITS.ALIAS_MAX}
              </span>
            </div>
            {errors.alias && <p role="alert" className="rm-error">{errors.alias.message}</p>}
          </div>
        </div>

        {!user && (
        <div className="rm-steprow rm-steprow--last">
          <span aria-hidden className="rm-steprow__num">2</span>
          <div className="rm-steprow__body">
            <span id="room-color-label" className="rm-step">
              Pick a color
              {colorName && <em className="rm-step__value">{colorName}</em>}
            </span>
            <RoomSwatchPicker
              value={color}
              onChange={(hex) => setValue('color', hex, { shouldValidate: true })}
              labelledBy="room-color-label"
            />
          </div>
        </div>
        )}
        {user && (
          <button type="button" className="rm-me__change mb-3" onClick={() => setCustom(false)}>
            Use my account name and photo
          </button>
        )}

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
          {joining ? 'Joining…' : 'Join room'}
          <span aria-hidden>→</span>
        </button>
        {connection !== 'online' && <p className="rm-joinhint" role="status">{CONNECTION_COPY[connection]}</p>}
      </form>
    </section>
  );
};

export default RoomPersonaForm;
