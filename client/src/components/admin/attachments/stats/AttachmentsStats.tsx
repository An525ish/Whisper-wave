import type { AttachmentKindFilter } from '@/types/admin';

export const StatChip = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) => (
  <div className="min-w-0 flex-1 px-4 first:pl-0 last:pr-0">
    <p className={`font-display text-2xl leading-none tabular-nums sm:text-3xl ${accent}`}>{value}</p>
    <p className="mt-1.5 text-xs font-medium text-body-300">{label}</p>
  </div>
);

export const StatDivider = () => (
  <div
    className="hidden w-px shrink-0 self-stretch bg-linear-to-b from-transparent via-border/60 to-transparent sm:block"
    aria-hidden
  />
);

type AttachmentsStatsProps = {
  hasFilter: boolean;
  kindFilter: AttachmentKindFilter;
  isLoading: boolean;
  matchTotal: number;
  mediaCount: number;
  linkCount: number;
  docCount: number;
};

const AttachmentsStats = ({
  hasFilter,
  kindFilter,
  isLoading,
  matchTotal,
  mediaCount,
  linkCount,
  docCount,
}: AttachmentsStatsProps) => (
  <section aria-label="Attachment summary" className="relative shrink-0">
    <div
      className="pointer-events-none absolute -left-6 top-0 h-28 w-48 rounded-full bg-blue/8 blur-3xl"
      aria-hidden
    />
    <div className="relative flex flex-wrap items-end border-b border-border/40 pb-6">
      <StatChip
        label={
          hasFilter
            ? 'Matches (messages)'
            : kindFilter === 'links'
              ? 'Link messages'
              : 'Files found'
        }
        value={isLoading ? '…' : matchTotal}
        accent="text-body"
      />
      <StatDivider />
      {kindFilter === 'links' ? (
        <StatChip label="Links extracted" value={linkCount} accent="text-blue" />
      ) : (
        <StatChip label="Images &amp; videos" value={mediaCount} accent="text-blue" />
      )}
      <StatDivider />
      <StatChip
        label={kindFilter === 'links' ? 'Loaded so far' : 'Documents'}
        value={kindFilter === 'links' ? linkCount : docCount}
        accent="text-green"
      />
    </div>
  </section>
);

export default AttachmentsStats;
