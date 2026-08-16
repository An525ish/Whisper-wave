import Image from '@/components/ui/Image';

type AvatarCardProps = {
  avatars?: Array<string | null | undefined>;
  max?: number;
  avatarClassName?: string;
  showOnline?: boolean;
};

const AvatarCard = ({ avatars, max = 3, avatarClassName, showOnline = false }: AvatarCardProps) => {
  const list =
    avatars && avatars.length > 0 ? avatars : [null];
  const shown = list.slice(0, Math.min(max, list.length));
  const stacked = shown.length > 1;

  return (
    <div className="relative mx-1 flex items-center md:mx-2">
      {shown.map((src, index) => (
        <div
          key={`${src ?? 'avatar'}-${index}`}
          className={`relative shrink-0 first:ml-0 ${
            stacked
              ? '-ml-5 md:-ml-6'
              : '-ml-3 md:-ml-4'
          }`}
          style={{ zIndex: shown.length - index }}
        >
          <div
            className={`overflow-hidden rounded-full border-2 border-border shadow-md ${
              stacked
                ? 'h-11 w-11 md:h-12 md:w-12'
                : 'h-11 w-11 md:h-12 md:w-12'
            } ${avatarClassName ?? ''}`}
          >
            {/* 96px covers 48px at 2× DPR — dpr_auto in the transform handles retina */}
            <Image
              src={src}
              alt="avatar-icon"
              className="h-full w-full"
              displayWidth={96}
            />
          </div>
          {showOnline && index === 0 ? (
            <span
              className="absolute -bottom-0.5 -right-0.5 z-10 h-3 w-3 rounded-full border-2 border-background bg-green"
              aria-hidden
            />
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default AvatarCard;
