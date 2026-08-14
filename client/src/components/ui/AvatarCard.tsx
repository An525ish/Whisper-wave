import Image from '@/components/ui/Image';

type AvatarCardProps = {
  avatars?: Array<string | null | undefined>;
  max?: number;
  avatarClassName?: string;
};

const AvatarCard = ({ avatars, max = 3, avatarClassName }: AvatarCardProps) => {
  const list =
    avatars && avatars.length > 0 ? avatars : [null];
  const shown = list.slice(0, Math.min(max, list.length));
  const stacked = shown.length > 1;

  return (
    <div className="relative mx-1 flex items-center md:mx-2">
      {shown.map((src, index) => (
        <div
          key={`${src ?? 'avatar'}-${index}`}
          className={`overflow-hidden rounded-full border-2 border-border shadow-md first:ml-0 ${
            stacked
              ? '-ml-5 h-10 w-10 md:-ml-6 md:h-11 md:w-11'
              : '-ml-3 h-11 w-11 md:-ml-4 md:h-12 md:w-12'
          } ${avatarClassName ?? ''}`}
          style={{ zIndex: shown.length - index }}
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
