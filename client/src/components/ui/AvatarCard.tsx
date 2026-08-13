import Image from '@/components/ui/Image';

type AvatarCardProps = {
  avatars?: Array<string | null | undefined>;
  max?: number;
  avatarClassName?: string;
};

const AvatarCard = ({ avatars, max = 3, avatarClassName }: AvatarCardProps) => {
  const list =
    avatars && avatars.length > 0 ? avatars : [null];

  return (
    <div className="relative mx-1 flex items-center md:mx-2">
      {list
        .slice(0, Math.min(max, list.length))
        .map((src, index) => (
          <div
            key={`${src ?? 'avatar'}-${index}`}
            className={`-ml-3 h-11 w-11 overflow-hidden rounded-full border-2 border-border shadow-md first:ml-0 md:-ml-4 md:h-12 md:w-12 ${avatarClassName ?? ''}`}
            style={{ zIndex: list.length - index }}
          >
            <Image
              src={src}
              alt="avatar-icon"
              className="h-full w-full"
            />
          </div>
        ))}
    </div>
  );
};

export default AvatarCard;
