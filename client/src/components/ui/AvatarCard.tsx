import Image from '@/components/ui/Image';

type AvatarCardProps = {
  avatars?: Array<string | null | undefined>;
  max?: number;
};

const AvatarCard = ({ avatars, max = 3 }: AvatarCardProps) => {
  const list =
    avatars && avatars.length > 0 ? avatars : [null];

  return (
    <div className="relative mx-2 flex items-center">
      {list
        .slice(0, Math.min(max, list.length))
        .map((src, index) => (
          <div
            key={`${src ?? 'avatar'}-${index}`}
            className="-ml-4 h-12 w-12 overflow-hidden rounded-full border-2 border-border shadow-md"
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
