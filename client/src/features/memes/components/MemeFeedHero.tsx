import './memesHero.css';

type Props = {
  unfiltered: boolean;
};

/** One quiet line above the feed: what you can do here, no banner. */
const MemeFeedHero = ({ unfiltered }: Props) => (
  <p className={`mm-note mm-rise${unfiltered ? ' mm-note--raw' : ''}`}>
    <span aria-hidden className="mm-note__dot" />
    <span>
      {unfiltered
        ? 'Raw jokes, 18+. Report anything that crosses a line.'
        : 'React, save, or send the good ones to a chat.'}
    </span>
  </p>
);

export default MemeFeedHero;
