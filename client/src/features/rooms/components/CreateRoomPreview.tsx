import type { CreateRoomVisibility } from '../types';
import { initialOf } from '../utils/art';
import './RoomLobbyCard.css';

type Props = {
  title: string;
  slug: string;
  description: string;
  rules: string[];
  visibility: CreateRoomVisibility;
  /** Current form step (0-2): the preview highlights the part being edited. */
  step: number;
};

/**
 * The room as people will meet it: the real lobby card styling, then the rules
 * board from the join page. Public rooms are green, private ones violet.
 */
const CreateRoomPreview = ({ title, slug, description, rules, visibility, step }: Props) => {
  const name = title.trim();
  const filled = rules.map((r) => r.trim()).filter(Boolean);
  const isPrivate = visibility === 'private';
  return (
    <aside aria-label="Room preview" className={`cr-wall cr-wall--${visibility} is-step-${step}`}>
      <p className="cr-wall__label"><i aria-hidden />Live preview</p>
      <p className="cr-wall__hint">{isPrivate ? 'How your invite page card looks' : 'How it shows in the lobby'}</p>

      <div className="rm-roomcard cr-roomcard">
        <span aria-hidden className={`rm-roomart rm-roomart--${isPrivate ? 0 : 2}`}>{initialOf(name)}</span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-[15px] font-semibold text-white${name ? '' : ' cr-dim'}`}>{name || 'Your room title'}</span>
          <span className={`mt-0.5 block truncate text-[13px] text-body-300${description.trim() ? '' : ' cr-dim'}`}>
            {description.trim() || 'What it is about'}
          </span>
          <span className="mt-1.5 flex items-center gap-1.5">
            <span className={`rm-roomstatus cr-kind${isPrivate ? ' cr-kind--private' : ' rm-roomstatus--live'}`}>
              <span aria-hidden className="rm-roomstatus__dot" />
              {isPrivate ? 'Invite only' : 'Public'}
            </span>
            <span className="rm-roomhours">/{slug.trim() || 'your-room'}</span>
          </span>
        </span>
      </div>

      <section className="cr-board" aria-label="House rules">
        <h3>House rules</h3>
        <ol>
          {[0, 1, 2, 3].map((i) =>
            filled[i] ? (
              <li key={`${i}-${filled[i]}`}><span>{i + 1}</span><span>{filled[i]}</span></li>
            ) : (
              <li key={i} className="is-empty" aria-hidden><span>{i + 1}</span><span /></li>
            ),
          )}
        </ol>
      </section>
    </aside>
  );
};

export default CreateRoomPreview;
