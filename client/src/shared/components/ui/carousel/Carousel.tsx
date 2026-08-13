import ReactSlick from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './styles.css';
import Image from '../Image';
import {
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import type { User } from '@/shared/types';

// Vite/ESM often nests the CJS default export one level deeper
const Slider = (
  (ReactSlick as unknown as { default?: ComponentType }).default ??
  ReactSlick
) as ComponentType<Record<string, unknown>>;

type CarouselMember = Pick<User, '_id' | 'name'> & {
  avatar?: string | null;
};

const MEMBERS_PER_SLIDE = 6;
/** Show pager once the slider has this many members */
const PAGER_FROM_COUNT = 4;
/** Prefer dots only while slide count stays compact */
const MAX_DOT_SLIDES = 4;

const chunkArray = <T,>(array: T[], chunkSize: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
};

type AvatarRingTone = 'silver' | 'green';

/** Gradient ring around circular avatars */
export function AvatarRing({
  children,
  className = '',
  tone = 'silver',
}: {
  children: ReactNode;
  className?: string;
  tone?: AvatarRingTone;
}) {
  return (
    <div
      className={`avatar-ring avatar-ring--${tone} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

/** @deprecated use AvatarRing tone="silver" */
export function SilverAvatarRing({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <AvatarRing tone="silver" className={className}>
      {children}
    </AvatarRing>
  );
}

type MemberSlideProps = {
  members: CarouselMember[];
};

function MemberSlide({ members }: MemberSlideProps) {
  return (
    <div className="grid w-full grid-cols-3 justify-items-center gap-x-2 gap-y-3 px-0.5 py-0.5">
      {members.map(({ name, avatar, _id }) => (
        <div
          key={_id}
          className="flex w-13 flex-col items-center gap-1"
          title={name}
        >
          <AvatarRing tone="silver" className="h-11 w-11">
            <Image
              className="h-full w-full rounded-full object-cover"
              src={avatar}
              alt={name}
            />
          </AvatarRing>
          <p className="w-full truncate text-center text-[10px] capitalize leading-tight text-body-300">
            {name.split(' ')[0] || name}
          </p>
        </div>
      ))}
    </div>
  );
}

type CarouselProps = {
  members: CarouselMember[];
  className?: string;
};

type SlickRef = {
  slickGoTo: (index: number) => void;
};

const Carousel = ({ members, className = '' }: CarouselProps) => {
  const sliderRef = useRef<SlickRef | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const memberChunks = useMemo(
    () => chunkArray(members, MEMBERS_PER_SLIDE),
    [members],
  );
  const slideCount = memberChunks.length;
  const showPager = members.length >= PAGER_FROM_COUNT;
  const hasMultipleSlides = slideCount > 1;
  const useDots = showPager && slideCount <= MAX_DOT_SLIDES;
  const useProgressPager = showPager && slideCount > MAX_DOT_SLIDES;

  const settings = {
    infinite: hasMultipleSlides,
    dots: false,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: hasMultipleSlides,
    autoplaySpeed: 2800,
    arrows: false,
    pauseOnHover: true,
    afterChange: (index: number) => setActiveSlide(index),
  };

  if (members.length === 0) {
    return (
      <div
        className={`grid min-h-16 place-items-center px-2 text-center text-xs text-body-300 ${className}`}
      >
        No other members yet
      </div>
    );
  }

  const progress = slideCount > 0 ? ((activeSlide + 1) / slideCount) * 100 : 0;

  return (
    <div className={`member-carousel ${className}`.trim()}>
      <Slider
        {...settings}
        ref={(instance: SlickRef | null) => {
          sliderRef.current = instance;
        }}
      >
        {memberChunks.map((chunk, index) => (
          <div key={index}>
            <MemberSlide members={chunk} />
          </div>
        ))}
      </Slider>

      {useDots ? (
        <div
          className="member-carousel-dots"
          role="tablist"
          aria-label="Member pages"
        >
          {memberChunks.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={activeSlide === index}
              aria-label={`Members page ${index + 1}`}
              className={`member-carousel-dot ${
                activeSlide === index ? 'is-active' : ''
              }`}
              onClick={() => sliderRef.current?.slickGoTo(index)}
            />
          ))}
        </div>
      ) : null}

      {useProgressPager ? (
        <div
          className="member-carousel-progress"
          aria-label={`Page ${activeSlide + 1} of ${slideCount}`}
        >
          <div className="member-carousel-progress-track">
            <div
              className="member-carousel-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="member-carousel-progress-label">
            <span className="text-green">{activeSlide + 1}</span>
            <span className="text-body-300"> / {slideCount}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default Carousel;
