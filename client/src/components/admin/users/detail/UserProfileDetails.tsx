import type { ReactNode } from 'react';
import CopyButton from '@/components/ui/CopyButton';
import {
  fieldValue,
  formatUserJoined,
  lastActiveAccent,
  relativeTime,
} from '@/utils/admin/users';

type StatBlockProps = {
  label: string;
  value: string;
  valueClass?: string;
  loading?: boolean;
  copyValue?: string | null;
};

const StatBlock = ({
  label,
  value,
  valueClass = 'text-body',
  loading,
  copyValue,
}: StatBlockProps) => (
  <div className="group relative px-4 py-4 text-center sm:px-5">
    {copyValue && !loading ? (
      <div className="absolute right-1.5 top-1.5 opacity-70 transition group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
        <CopyButton value={copyValue} label={label} variant="panel" />
      </div>
    ) : null}
    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-body-300/45">
      {label}
    </p>
    {loading ? (
      <div className="mx-auto mt-2.5 h-4 w-20 animate-pulse rounded bg-border/25" />
    ) : (
      <p className={`mt-2 font-display text-lg leading-tight tabular-nums ${valueClass}`}>
        {value}
      </p>
    )}
  </div>
);

type DetailRowProps = {
  label: string;
  children: ReactNode;
  loading?: boolean;
  copyValue?: string | null;
};

const DetailRow = ({ label, children, loading, copyValue }: DetailRowProps) => (
  <div className="group px-3 py-1 sm:px-4">
    <div className="flex items-start justify-between gap-2 rounded-xl px-2 py-3 transition hover:bg-primary/15 sm:px-3">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-body-300/45">
          {label}
        </p>
        {loading ? (
          <div className="mt-2.5 h-4 w-3/4 max-w-xs animate-pulse rounded bg-border/25" />
        ) : (
          <div className="mt-2">{children}</div>
        )}
      </div>
      {copyValue && !loading ? (
        <CopyButton value={copyValue} label={label} variant="panel" />
      ) : null}
    </div>
  </div>
);

type UserProfileDetailsProps = {
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

const UserProfileDetails = ({ user, isLoading }: UserProfileDetailsProps) => {
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
