import { MemesHubPreview } from '@/features/memes';
import HomeTide from './HomeTide';

type Props = {
  roomsLive: boolean;
  memesLive: boolean;
  onDoorClick: (id: string) => void;
};

const headingClass = 'mt-3 font-display text-3xl text-white md:text-4xl';
const copyClass = 'mt-2 max-w-lg text-sm leading-relaxed text-body-300 md:text-base';

/**
 * The living previews: tonight's tides and a sideways taste of the tap.
 * A dark surface renders no section at all. Editorial headline outside, the
 * living thing itself inside a glass panel — the landing's bento rhythm,
 * retold for the hub.
 */
const HomeSections = ({ roomsLive, memesLive, onDoorClick }: Props) => (
  <>
    {roomsLive && (
      <section aria-label="Rooms tonight" className="hw-rise" style={{ '--hw-d': '90ms' } as React.CSSProperties}>
        <p className="hw-eyebrow hw-eyebrow--live">
          <span aria-hidden className="hw-eyebrow__dot" />
          Live rooms
        </p>
        <h2 className={headingClass}>
          Tonight on the <span className="hw-iri italic">wave.</span>
        </h2>
        <p className={copyClass}>
          Small crowds, real talk, no chat history kept. Walk into a topic — or lurk until it feels right.
        </p>
        <div className="hw-glass hw-rim relative mt-5 overflow-hidden rounded-3xl p-4 md:p-6">
          <div aria-hidden className="hw-cardglow hw-cardglow--rooms" />
          <div className="relative">
            <HomeTide />
          </div>
        </div>
      </section>
    )}

    {memesLive && (
      <section aria-label="Memes" className="hw-rise" style={{ '--hw-d': '180ms' } as React.CSSProperties}>
        <p className="hw-eyebrow">
          <span aria-hidden className="hw-eyebrow__dot" />
          Fresh laughs
        </p>
        <h2 className={headingClass}>
          Laughs on <span className="hw-iri italic">shuffle.</span>
        </h2>
        <p className={copyClass}>
          No algorithm, no feed that studies you. Just jokes, shuffled — for when nobody&apos;s online.
        </p>
        <div className="hw-glass hw-rim relative mt-5 overflow-hidden rounded-3xl p-4 md:p-6">
          <div aria-hidden className="hw-cardglow hw-cardglow--memes" />
          <div className="relative">
            <MemesHubPreview onOpenFeed={() => onDoorClick('memes')} />
          </div>
        </div>
      </section>
    )}
  </>
);

export default HomeSections;
