import './memesStates.css';

/** Placeholder card while a page loads. */
const MemeSkeleton = () => (
  <div className="mm-skel" aria-hidden>
    <div className="mm-skel__media" />
    <div className="mm-skel__line" />
    <div className="mm-skel__line mm-skel__line--short" />
  </div>
);

export default MemeSkeleton;
