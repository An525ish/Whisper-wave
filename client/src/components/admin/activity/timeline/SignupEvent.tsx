import Image from '@/components/ui/Image';
import type { AdminActivitySignup } from '@/types/admin';
import { activityRelativeTime } from '@/utils/admin/activity';

const SignupEvent = ({ user }: { user: AdminActivitySignup }) => (
  <article className="group min-w-0 rounded-xl px-3 py-3 transition-colors hover:bg-primary/25 sm:px-4">
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/50 ring-2 ring-green/20">
        <Image
          src={user.avatar?.url}
          alt={user.name}
          className="h-full w-full object-cover"
          displayWidth={80}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold text-body">{user.name}</span>
          <span className="text-xs text-body-300/50">@{user.username}</span>
          <span className="rounded-md bg-green/10 px-2 py-0.5 text-[10px] font-medium text-green">
            New member
          </span>
        </div>
        <p className="mt-1 text-sm text-body-300/60">Joined the platform</p>
      </div>
      <time className="shrink-0 text-[11px] tabular-nums text-body-300/45">
        {activityRelativeTime(user.createdAt)}
      </time>
    </div>
  </article>
);

export default SignupEvent;
