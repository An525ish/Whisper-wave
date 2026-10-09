type Props = {
  onFindSomeoneNew: () => void;
};

/** What the thread-ended card collapses to after "Stay and re-read it". */
export default function ThreadEndedBar({ onFindSomeoneNew }: Props) {
  return (
    <div className="acr-ended-bar" role="status">
      <p className="acr-ended-bar__text">That thread ended.</p>
      <button type="button" className="acr-ended-bar__cta" onClick={onFindSomeoneNew}>
        Find someone new
      </button>
    </div>
  );
}
