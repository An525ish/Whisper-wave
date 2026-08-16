import Image from '@/components/ui/Image';
import MembersIcon from '@/components/ui/icons/Members';
import LiveDot from './LiveDot';
import type { AdminActivityUser } from '@/types/admin';

const OnlineAvatar = ({ user }: { user: AdminActivityUser }) => (
  <div
    className="group flex w-18 shrink-0 flex-col items-center gap-2"
    title={`@${user.username}`}
  >
    <div className="relative">
      <div className="h-11 w-11 overflow-hidden rounded-full ring-2 ring-green/25 transition group-hover:ring-green/50">
        <Image
          src={user.avatar?.url}
          alt={user.name}
          className="h-full w-full object-cover"
          displayWidth={96}
        />
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green" />
    </div>
    <p className="w-full truncate text-center text-[10px] leading-tight text-body-300/70">
      {user.name.split(' ')[0]}
    </p>
  </div>
);

type OnlinePanelProps = {
  users: AdminActivityUser[];
  count: number;
  extra: number;
};

const OnlinePanel = ({ users, count, extra }: OnlinePanelProps) => (
  <section className="relative flex h-full flex-col">
    <div className="flex items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <LiveDot />
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-green">Presence</p>
        </div>
        <p className="mt-2 font-display text-3xl leading-none tabular-nums text-body">
          {count}
          <span className="ml-2 text-sm font-normal text-body-300">online</span>
        </p>
      </div>
      {extra > 0 && (
        <span className="rounded-full border border-border/50 bg-primary/35 px-2.5 py-1 text-[10px] font-medium text-body-300">
          +{extra} more
        </span>
      )}
    </div>

    <div className="relative mt-6 min-h-0 shrink-0 lg:mt-0 lg:flex-1">
      <div
        className="pointer-events-none absolute -left-6 top-0 h-32 w-40 rounded-full bg-green/10 blur-3xl"
        aria-hidden
      />
      {users.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/40">
            <MembersIcon className="h-5 w-5 text-body-300/40" />
          </div>
          <p className="text-sm text-body-300/60">Nobody online right now</p>
        </div>
      ) : (
        <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {users.map((user) => (
            <OnlineAvatar key={user._id} user={user} />
          ))}
        </div>
      )}
    </div>
  </section>
);

export default OnlinePanel;
