import { ROOM_LISTENING_COPY } from '../constants';
import './roomComposer.css';

type Props = {
  onHelp: () => void;
};

/** Persistent, calm safety line for listening rooms — always visible above the composer. */
const RoomListeningStrip = ({ onHelp }: Props) => (
  <div role="note" aria-label="Safety notice" className="rm-listening">
    <p>{ROOM_LISTENING_COPY.strip}</p>
    <button type="button" onClick={onHelp} className="rm-support__dismiss">
      {ROOM_LISTENING_COPY.stripAction}
    </button>
  </div>
);

export default RoomListeningStrip;
