import Image from '@/components/ui/Image'
import Carousel, { AvatarRing } from '@/components/ui/carousel/Carousel'
import { getFirstName } from '@/utils/helpers'

type GroupCreator = {
  _id?: string;
  name?: string;
  avatar?: string;
};

type GroupMember = {
  _id?: string;
  name?: string;
  avatar?: string;
  isCreator?: boolean;
  isAdmin?: boolean;
};

type GroupMembersListProps = {
  creator: GroupCreator | undefined;
  members: GroupMember[] | undefined;
  onMemberClick?: (memberId: string) => void;
};

const GroupMembersList = ({ creator, members, onMemberClick }: GroupMembersListProps) => {
  const creatorName = creator ? getFirstName(creator.name) : 'Unknown'
  const otherMembers = (members ?? []).filter((m) => !m.isCreator)

  return (
    <section className="mx-3 mt-1 flex flex-col gap-3 rounded-2xl bg-primary/40 px-3.5 py-3.5 ring-1 ring-border/50 sm:grid sm:grid-cols-[6.5rem_1px_1fr] sm:items-center sm:gap-x-4">
      <button
        type="button"
        disabled={!creator?._id || !onMemberClick}
        onClick={() => creator?._id && onMemberClick?.(creator._id)}
        className="flex flex-col items-center gap-2 rounded-xl transition enabled:hover:opacity-90 enabled:active:scale-[0.98] disabled:cursor-default"
        aria-label={creator?._id ? `Open chat with ${creatorName}` : undefined}
      >
        <div className="relative z-10">
          <AvatarRing tone="green" className="h-19 w-19">
            <Image
              src={creator?.avatar}
              alt={creatorName}
              className="h-full w-full rounded-full object-cover bg-background-alt"
            />
          </AvatarRing>
          <span className="absolute -bottom-0.5 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded bg-black-dark px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-gold ring-1 ring-gold/55">
            Creator
          </span>
        </div>
        <p className="mt-1 w-full truncate text-center text-sm font-medium capitalize leading-tight text-body">
          {creatorName}
        </p>
      </button>

      <div
        className="h-px w-full self-stretch bg-linear-to-r from-transparent via-border to-transparent sm:h-full sm:min-h-20 sm:w-auto sm:bg-linear-to-b"
        aria-hidden
      />

      <Carousel
        members={otherMembers.map((m) => ({
          _id: m._id ?? '',
          name: m.name ?? '',
          avatar: m.avatar ?? null,
        }))}
        onMemberClick={onMemberClick}
        className="min-w-0"
      />
    </section>
  )
}

export default GroupMembersList
