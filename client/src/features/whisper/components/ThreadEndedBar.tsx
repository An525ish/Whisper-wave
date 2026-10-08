type Props = {
  onFindSomeoneNew: () => void;
};

/** What the thread-ended card collapses to after "Stay and re-read it". */
export default function ThreadEndedBar({ onFindSomeoneNew }: Props) {
  return (
    <div className="acr-mutual-bar" role="status">
      <p className="min-w-0 text-left text-xs font-medium text-body-300">That thread ended.</p>
      <button type="button" className="acr-mutual-bar__cta" onClick={onFindSomeoneNew}>
        Find someone new
      </button>
    </div>
  );
}
