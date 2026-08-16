import type { AdminMessageAttachment, AdminMessageStatusFilter, UserFilterOption } from '@/types/admin';
import { resolveAttachmentKind, type AttachmentKind } from '@/utils/fileFormat';

export const messageRelativeTime = (dateStr?: string): string => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const formatMessageSent = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const isImageAttachment = (att: AdminMessageAttachment): boolean => {
  const kind = resolveAttachmentKind(att);
  return kind === 'image' || kind === 'gif';
};

export const isVideoAttachment = (att: AdminMessageAttachment): boolean =>
  resolveAttachmentKind(att) === 'video';

export const messageAttachmentLabel = (att: AdminMessageAttachment): string => {
  const kind: AttachmentKind = resolveAttachmentKind(att);
  if (kind === 'image') return 'Image';
  if (kind === 'video') return 'Video';
  if (kind === 'audio') return 'Audio';
  return att.name || 'File';
};

export const messagesFeedSubtitle = (
  senderFilter: UserFilterOption | null,
  querySearch: string,
): string => {
  if (senderFilter) {
    return `Sent by ${senderFilter.name}${querySearch ? ` · ${querySearch}` : ''}`;
  }
  if (querySearch) {
    return `Search results for “${querySearch}”`;
  }
  return 'Latest messages across chats';
};

export const messagesEmptyDescription = (
  senderFilter: UserFilterOption | null,
  querySearch: string,
  statusFilter: AdminMessageStatusFilter,
): string => {
  if (senderFilter) {
    return `No messages from ${senderFilter.name} yet`;
  }
  if (querySearch || statusFilter !== 'all') {
    return 'Try a different filter or search term';
  }
  return 'No messages have been sent yet';
};

export const messagesHasActiveFilter = (
  querySearch: string,
  statusFilter: AdminMessageStatusFilter,
  senderFilter: UserFilterOption | null,
): boolean => Boolean(querySearch || statusFilter !== 'all' || senderFilter);

export const messagesMatchesLabel = (
  querySearch: string,
  statusFilter: AdminMessageStatusFilter,
  senderFilter: UserFilterOption | null,
): string => (messagesHasActiveFilter(querySearch, statusFilter, senderFilter) ? 'Matches' : 'Loaded');

export const messagesMatchesValue = (
  querySearch: string,
  statusFilter: AdminMessageStatusFilter,
  senderFilter: UserFilterOption | null,
  matchTotal: number,
  loadedCount: number,
): number =>
  messagesHasActiveFilter(querySearch, statusFilter, senderFilter) ? matchTotal : loadedCount;
