import CopyButton from '@/shared/components/ui/CopyButton';
import StatBlock from './StatBlock';
import DetailRow from './DetailRow';
import {
  fieldValue,
  formatUserJoined,
  lastActiveAccent,
  relativeTime,
} from '../../../utils/users';

type Props = {
  user?: {
    username?: string;
    email?: string;
    bio?: string;
    lastSeen?: string;
    createdAt?: string;
    _id?: string;
  };
  isLoading: boolean;
};

const UserProfileDetails = ({ user, isLoading }: Props) => {
  const email = fieldValue(user?.email);
  const bio = fieldValue(user?.bio);
  const username = fieldValue(user?.username);
  const userId = user?._id ? String(user._id) : null;
  const joinedLabel = formatUserJoined(user?.createdAt);
  const lastActiveLabel = relativeTime(user?.lastSeen);
  const lastActiveCopy =
    user?.lastSeen != null
      ? `${lastActiveLabel} (${new Date(user.lastSeen).toLocaleString()})`
      : lastActiveLabel;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/35 bg-linear-to-b from-primary/30 via-primary/15 to-primary/5 shadow-sm">
      <div className="grid grid-cols-2 divide-x divide-border/25 border-b border-border/25 bg-background/10">
        <StatBlock
          label="Member since"
          value={joinedLabel}
          copyValue={user?.createdAt ? joinedLabel : null}
          loading={isLoading}
        />
        <StatBlock
          label="Last active"
          value={lastActiveLabel}
          valueClass={lastActiveAccent(user?.lastSeen)}
          copyValue={lastActiveCopy}
          loading={isLoading}
        />
      </div>

      <div className="divide-y divide-border/20 py-1">
        <DetailRow
          label="Username"
          copyValue={username ? `@${username}` : null}
          loading={isLoading}
        >
          {username ? (
            <p className="text-sm font-medium text-body">@{username}</p>
          ) : (
            <p className="text-sm italic text-body-300/45">No username</p>
          )}
        </DetailRow>

        <DetailRow label="Email" copyValue={email} loading={isLoading}>
          {email ? (
            <a
              href={`mailto:${email}`}
              className="break-all text-sm text-blue transition hover:text-blue/80"
            >
              {email}
            </a>
          ) : (
            <p className="text-sm italic text-body-300/45">No email on file</p>
          )}
        </DetailRow>

        <DetailRow label="Bio" copyValue={bio} loading={isLoading}>
          {bio ? (
            <blockquote className="border-l-2 border-blue/35 pl-3.5 text-sm leading-relaxed whitespace-pre-wrap text-body-300">
              {bio}
            </blockquote>
          ) : (
            <p className="text-sm italic text-body-300/45">No bio yet</p>
          )}
        </DetailRow>
      </div>

      <div className="border-t border-border/25 bg-background/25 px-4 py-3.5 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-body-300/40">
            User ID
          </p>
          {userId && !isLoading ? (
            <CopyButton value={userId} label="User ID" variant="panel" />
          ) : null}
        </div>
        {isLoading ? (
          <div className="mt-2 h-9 w-full animate-pulse rounded-lg bg-border/20" />
        ) : (
          <p className="mt-2 break-all rounded-lg border border-border/25 bg-primary/20 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-body-300/75 select-all">
            {userId ?? '—'}
          </p>
        )}
      </div>
    </div>
  );
};

export default UserProfileDetails;
