import { useScrollStory } from '@/hooks/landing/useScrollStory';
import StoryVisualPanel from '@/components/landing/ui/StoryVisualPanel';

const CHAPTERS = [
  {
    number: '01',
    title: 'Pick a vibe name.',
    body: [
      'No real name. No photo. No profile to judge.',
      'Type something that feels like tonight — midnight_fox, chaos_agent, soft_rain. Or grab one we generate for you.',
      'Add a couple of vibe tags. Hit Find. That\'s your entire identity here.',
    ],
    detail: 'Anonymous · Ephemeral · No account needed',
  },
  {
    number: '02',
    title: 'Matched with a stranger.',
    body: [
      'Real-time queue. We pair two people who are both looking right now.',
      'You see their display name and vibe tags. They see yours. Nothing else.',
      'No bio to overthink. No algorithm deciding if you\'re good enough. You either say hi or you don\'t.',
    ],
    detail: 'Text chat · No read receipts · Pure serendipity',
  },
  {
    number: '03',
    title: 'If it\'s a vibe — connect.',
    body: [
      'One tap. A like button that sits quietly in the corner.',
      'If both of you tap it — mutual spark. "IT\'S A VIBE" screen. A connect button appears.',
      'Connect → account created → real DM unlocked. That tension between anonymous and real? That\'s the whole product.',
    ],
    detail: 'Skip and they\'re gone forever · Connect and they\'re yours',
  },
] as const;

const ScrollStorySection = () => {
  const { activeChapter, setChapterRef } = useScrollStory(CHAPTERS.length);

  return (
    <section className="scroll-story" aria-label="How Whisper Wave works">
      {/* Section header */}
      <div className="scroll-story__header">
        <p className="scroll-story__eyebrow">the loop</p>
        <h2 className="scroll-story__title font-display">How it works.</h2>
      </div>

      {/* Sticky + scroll layout */}
      <div className="scroll-story__layout">
        {/* Sticky visual panel — desktop */}
        <div className="scroll-story__sticky-col" aria-hidden>
          <div className="scroll-story__sticky-inner">
            {/* Chapter progress indicator */}
            <div className="scroll-story__progress" aria-hidden>
              {CHAPTERS.map((_, i) => (
                <div
                  key={i}
                  className={`scroll-story__progress-dot${activeChapter === i + 1 ? ' scroll-story__progress-dot--active' : ''}`}
                />
              ))}
            </div>

            <StoryVisualPanel chapter={activeChapter} />
          </div>
        </div>

        {/* Scrolling chapters */}
        <div className="scroll-story__chapters-col">
          {CHAPTERS.map((chapter, i) => (
            <div
              key={chapter.number}
              ref={setChapterRef(i) as React.RefCallback<HTMLDivElement>}
              className={`scroll-story__chapter${activeChapter === i + 1 ? ' scroll-story__chapter--active' : ''}`}
            >
              {/* Mobile visual — shown only on small screens */}
              <div className="scroll-story__mobile-visual" aria-hidden>
                <StoryVisualPanel chapter={(i + 1) as 1 | 2 | 3} />
              </div>

              {/* Chapter number */}
              <div className="scroll-story__chapter-num font-display" aria-hidden>
                {chapter.number}
              </div>

              {/* Chapter content */}
              <div className="scroll-story__chapter-body">
                <h3 className="scroll-story__chapter-title font-display">
                  {chapter.title}
                </h3>
                <div className="scroll-story__chapter-paras">
                  {chapter.body.map((para, j) => (
                    <p key={j} className="scroll-story__chapter-para">
                      {para}
                    </p>
                  ))}
                </div>
                <p className="scroll-story__chapter-detail">{chapter.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScrollStorySection;
