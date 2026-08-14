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
};

const GroupMembersList = ({ creator, members }: GroupMembersListProps) => {
  const creatorName = creator ? getFirstName(creator.name) : 'Unknown'
  const otherMembers = (members ?? []).filter((m) => !m.isCreator)

  return (
    <section className="mx-3 mt-1 flex flex-col gap-3 rounded-2xl bg-primary/40 px-3.5 py-3.5 ring-1 ring-border/50 sm:grid sm:grid-cols-[6.5rem_1px_1fr] sm:items-center sm:gap-x-4">
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <AvatarRing tone="green" className="h-19 w-19">
            <Image
              src={creator?.avatar}
              alt={creatorName}
              className="h-full w-full rounded-full object-cover bg-background-alt"
            />
          </AvatarRing>
          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black-dark px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-gold ring-1 ring-gold/55">
            Creator
          </span>
        </div>
        <p className="mt-1 w-full truncate text-center text-sm font-medium capitalize leading-tight text-body">
          {creatorName}
        </p>
      </div>

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
        className="min-w-0"
      />
    </section>
  )
}

export default GroupMembersList
