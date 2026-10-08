import './TypingDots.css';

type Props = {
  /** Announced instead of the animation, e.g. "Ada is typing". */
  label: string;
  /** Placement/size overrides from the host list. */
  className?: string;
};

/**
 * Three-dot "the other person is typing" bubble.
 *
 * The anonymous room animated its own dots while the logged-in thread printed a
 * text-only "typing…"; both are this now. Domain-agnostic on purpose — the host
 * decides the wording and the alignment, so nothing here knows about chat.
 */
const TypingDots = ({ label, className = '' }: Props) => (
  <div
    role="status"
    className={`bubble-in flex w-fit items-center gap-1.5 border border-border bg-primary/90 px-3 py-2 ${className}`.trim()}
  >
    <span className="sr-only">{label}</span>
    <span aria-hidden className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span key={i} className="typing-dots__dot" style={{ animationDelay: `${i * 200}ms` }} />
      ))}
    </span>
  </div>
);

export default TypingDots;
