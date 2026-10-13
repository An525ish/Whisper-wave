import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { ROOM_ALIAS_COLORS } from '../constants';
import { useRoomInfo } from '../hooks/useRoomsQueries';
import { defaultColor, readRoomsPersona } from '../utils/persona';
import { roomAliasSchema, type RoomAliasForm } from '../utils/roomValidators';
import './rooms.css';

type Props = {
  slug: string;
  invite?: string;
  onJoin: (params: { alias: string; color: string }) => void;
};

/**
 * A door, slightly ajar — light spilling out, chatter leaking through.
 * Hovering the knock swings it wider. Pure inline SVG in the room palette.
 */
const DoorScene = () => (
  <svg
    viewBox="0 0 360 230"
    fill="none"
    aria-hidden
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="rmq-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#241b33" />
        <stop offset="1" stopColor="#160f1f" />
      </linearGradient>
      <linearGradient id="rmq-door" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#4a3568" />
        <stop offset="1" stopColor="#2a1e40" />
      </linearGradient>
      <linearGradient id="rmq-beam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7dffb8" stopOpacity="0.85" />
        <stop offset="1" stopColor="#7dffb8" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="rmq-pool" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#01c36d" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#01c36d" stopOpacity="0" />
      </radialGradient>
    </defs>

    <rect x="0" y="0" width="360" height="230" fill="url(#rmq-wall)" />
    <rect x="0" y="0" width="360" height="230" fill="#000" opacity="0.25" />

    {/* leaked chatter */}
    <g className="rmq-bubble">
      <rect x="42" y="78" width="58" height="32" rx="16" fill="#2a2140" stroke="rgba(139,107,255,0.55)" strokeWidth="1.2" />
      <rect x="54" y="89" width="30" height="4.5" rx="2.25" fill="#efeaf9" opacity="0.8" />
      <rect x="54" y="98" width="38" height="4" rx="2" fill="#efeaf9" opacity="0.4" />
    </g>
    <g className="rmq-bubble" style={{ animationDelay: '-1.7s' }}>
      <rect x="22" y="128" width="48" height="28" rx="14" fill="#16281f" stroke="rgba(53,224,200,0.45)" strokeWidth="1.2" />
      <rect x="32" y="138" width="28" height="4.5" rx="2.25" fill="#86f2e4" opacity="0.7" />
    </g>
    <g className="rmq-bubble" style={{ animationDelay: '-3.1s' }}>
      <rect x="66" y="34" width="44" height="26" rx="13" fill="#2a2140" stroke="rgba(139,107,255,0.4)" strokeWidth="1.2" />
      <rect x="76" y="43" width="24" height="4.5" rx="2.25" fill="#b6a4ff" opacity="0.7" />
    </g>

    {/* frame + dark opening */}
    <rect x="125" y="18" width="110" height="192" rx="8" fill="#0e0a14" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
    <rect x="133" y="26" width="94" height="184" fill="#050308" />

    {/* light spill + floor pool */}
    <g className="rmq-light">
      <polygon points="196,30 232,210 96,210 138,30" fill="url(#rmq-beam)" opacity="0.55" />
      <ellipse cx="168" cy="212" rx="82" ry="12" fill="url(#rmq-pool)" className="rmq-flicker" />
    </g>

    {/* the slab, ajar */}
    <g className="rmq-door">
      <polygon points="133,26 189,38 189,210 133,210" fill="url(#rmq-door)" stroke="rgba(182,164,255,0.4)" strokeWidth="1.2" />
      <polygon points="142,60 176,66 176,120 142,120" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1.2" />
      <polygon points="142,134 176,134 176,188 142,188" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1.2" />
      <circle cx="179" cy="122" r="5" fill="#7dffb8" />
      <circle cx="179" cy="122" r="8.5" fill="none" stroke="#7dffb8" strokeWidth="1" opacity="0.4" />
      <path d="M189 38 L189 210" stroke="#7dffb8" strokeWidth="1.5" opacity="0.55" />
    </g>
  </svg>
);

/**
 * The doorway as a door: slightly ajar, light spilling out, chatter leaking
 * through the gap. The crowd shows who's already inside; knocking (the join
 * button) swings it wider. Joining from here is the only entry — the socket
 * never sends a persona the user hasn't seen and confirmed.
 */
const RoomRulesSheet = ({ slug, invite, onJoin }: Props) => {
  const { data: room, isLoading, isError } = useRoomInfo(slug, invite);
  const stored = readRoomsPersona();
  const [knock, setKnock] = useState(false);

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
  const alias = watch('alias');

  const submit = (values: RoomAliasForm) => {
    onJoin({ alias: values.alias.trim(), color: values.color ?? defaultColor(values.alias) });
  };

  if (isLoading) {
    return (
      <div className="rmq-page">
        <div aria-hidden className="rmq-stars" />
        <div aria-hidden className="rmq-moon" />
        <main className="rmq-wrap" aria-label="Loading room">
          <div className="rmq-state mx-auto w-full max-w-md md:col-span-2">
            <div className="rm-skel__art" style={{ width: '100%', height: '10rem', borderRadius: '1rem' }} aria-hidden />
            <div style={{ marginTop: '1rem' }} aria-hidden>
              <div className="rm-skel__line" />
              <div className="rm-skel__line rm-skel__line--short" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isError || !room) {
    return (
      <div className="rmq-page">
        <div aria-hidden className="rmq-stars" />
        <div aria-hidden className="rmq-moon" />
        <main className="rmq-wrap">
          <div className="rmq-state mx-auto w-full max-w-md md:col-span-2" style={{ textAlign: 'center' }}>
            <p className="rm-empty__title">No door here.</p>
            <p className="rm-empty__sub">It may have been removed — or the link is wrong.</p>
            <Link to={ROUTES.rooms} className="rm-joinbtn mt-5 inline-block w-full">
              Browse rooms
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!room.open) {
    return (
      <div className="rmq-page">
        <div aria-hidden className="rmq-stars" />
        <div aria-hidden className="rmq-moon" />
        <main className="rmq-wrap">
          <div className="rmq-state mx-auto w-full max-w-md md:col-span-2" style={{ textAlign: 'center' }}>
            <p className="rm-empty__title">The door is shut.</p>
            <p className="rm-empty__sub">{room.title} keeps hours — check back later.</p>
            <Link to={ROUTES.rooms} className="rm-joinbtn mt-5 inline-block w-full">
              Browse rooms
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const live = room.totalOnline > 0;
  const faces = Math.min(room.totalOnline, 8);
  const previewAlias = alias.trim() || 'Your alias';
  const previewInitial = (alias.trim().charAt(0) || '?').toUpperCase();
  const previewColor = color ?? defaultColor(alias);
  const hoursLabel = !room.hours
    ? 'Always open'
    : room.hours.days.length === 7
      ? `Nightly ${room.hours.start}–${room.hours.end}`
      : `${room.hours.start}–${room.hours.end} ${room.hours.tz.split('/').pop()}`;

  return (
    <div className="rmq-page">
      <div aria-hidden className="rmq-stars" />
      <div aria-hidden className="rmq-moon" />
      <div aria-hidden className="rm-grain" />
      <main className="rmq-wrap">
        <Link to={ROUTES.rooms} className="rm-backlink rmq-back">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          All rooms
        </Link>

        <div className={`rmq-scene${knock ? ' rmq-open' : ''}`}>
          <DoorScene />
          <div className="rmq-stageinfo">
            {live ? (
              <div className="rmq-crowd">
                <span className="rmq-faces" aria-hidden>
                  {Array.from({ length: faces }, (_, i) => (
                    <span key={i} className="rmq-face">?</span>
                  ))}
                </span>
                <p>
                  {room.totalOnline} {room.totalOnline === 1 ? 'soul' : 'souls'} inside right now
                </p>
              </div>
            ) : (
              <p className="rmq-quiet">Quiet now — you’d be the first face in the door</p>
            )}
            <div className="rm-joinpills">
              <span className="rm-officialpill">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 2l2.4 4.9 5.6.8-4 4 1 5.6-5-2.6-5 2.6 1-5.6-4-4 5.6-.8L12 2z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
                {room.official ? 'Official room' : 'Community room'}
              </span>
            </div>
            <h1 className="rm-jointitle">{room.title}</h1>
            <p className="rm-joindesc">{room.description}</p>
            <div className="rm-joinmeta">
              <span>{hoursLabel}</span>
              <span>{room.lang}</span>
            </div>
          </div>
        </div>

        <div className="rmq-side">
          <section aria-label="House rules" className="rm-rulescard">
            <h2 className="rm-rulescard__label">House rules</h2>
            <ol>
              {room.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>
          </section>

          <section aria-label="Choose your presence" className="rm-persona">
            <div className="rm-persona__preview" aria-hidden>
              <span
                className="rm-persona__avatar"
                style={{
                  color: previewColor,
                  backgroundColor: `${previewColor}1f`,
                  borderColor: `${previewColor}55`,
                }}
              >
                {previewInitial}
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
                maxLength={24}
                className="rm-input"
              />
              {errors.alias && <p role="alert" className="rm-error">{errors.alias.message}</p>}

              <span id="room-color-label" className="rm-field">
                Your color
              </span>
              <div role="radiogroup" aria-labelledby="room-color-label" className="rm-swatches">
                {ROOM_ALIAS_COLORS.map((c) => {
                  const selected = color === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={`Color ${c}`}
                      onClick={() => setValue('color', c, { shouldValidate: true })}
                      style={{ backgroundColor: c, color: c }}
                      className={`rm-swatch${selected ? ' rm-swatch--on' : ''}`}
                    >
                      {selected && (
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path
                            d="M5 13l4 4L19 7"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="submit"
                className="rm-joinbtn"
                onMouseEnter={() => setKnock(true)}
                onMouseLeave={() => setKnock(false)}
                onFocus={() => setKnock(true)}
                onBlur={() => setKnock(false)}
              >
                Knock and enter
                <span aria-hidden>→</span>
              </button>
              <p className="rm-joinhint">
                They’ll only ever know you as {previewAlias}.
              </p>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
};

export default RoomRulesSheet;
