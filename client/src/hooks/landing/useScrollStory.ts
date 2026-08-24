import { useEffect, useRef, useState } from 'react';

export type StoryChapter = 1 | 2 | 3;

export const useScrollStory = (chapterCount: number) => {
  const [activeChapter, setActiveChapter] = useState<StoryChapter>(1);
  const chapterRefs = useRef<(HTMLElement | null)[]>([]);

  const setChapterRef = (index: number) => (el: HTMLElement | null) => {
    chapterRefs.current[index] = el;
  };

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    chapterRefs.current.forEach((el, i) => {
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveChapter((i + 1) as StoryChapter);
          }
        },
        { threshold: 0.45, rootMargin: '-10% 0px -10% 0px' },
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [chapterCount]);

  return { activeChapter, setChapterRef };
};
