import { ROOM_SUPPORT_COPY } from '../constants';
import { browserHelplines } from '../utils/helplines';
import './roomComposer.css';

type Props = {
  onDismiss: () => void;
};

/**
 * Resources card: shown to the sender after self-harm language, or on request
 * from a listening room's strip. Region-aware helplines; never a punishment.
 */
const RoomSupportNotice = ({ onDismiss }: Props) => (
  <div role="note" aria-label="Support resources" className="rm-support">
    <div className="rm-support__card">
      <p className="text-sm font-medium text-white">{ROOM_SUPPORT_COPY.title}</p>
      <p className="mt-1 text-[13px] leading-relaxed text-body-300">{ROOM_SUPPORT_COPY.body}</p>
      <ul className="rm-support__lines">
        {browserHelplines().map((line) => (
          <li key={line.href}>
            {line.name}:{' '}
            <a href={line.href} {...(line.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
              {line.contact}
            </a>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onDismiss} className="rm-support__dismiss">
        Dismiss
      </button>
    </div>
  </div>
);

export default RoomSupportNotice;
