import type {
  AdminAttachmentsPage,
  AdminMessageAttachment,
  AttachmentKindFilter,
  FlatItem,
  LinkItem,
} from '@/types/admin';
import { resolveAttachmentKind, type AttachmentKind } from '@/utils/fileFormat';

const URL_RE = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;

export const matchesKind = (att: AdminMessageAttachment, kind: AttachmentKindFilter): boolean => {
  const k = resolveAttachmentKind(att);
  if (kind === 'all') return k === 'image' || k === 'video' || k === 'gif' || k === 'doc';
  if (kind === 'images') return k === 'image';
  if (kind === 'videos') return k === 'video';
  if (kind === 'gifs') return k === 'gif';
  if (kind === 'docs') return k === 'doc';
  return false;
};

export const extractUrls = (content = ''): string[] => {
  const raw = content.match(URL_RE) ?? [];
  return [...new Set(raw)];
};

export const urlDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const attachmentRelativeTime = (dateStr?: string): string => {
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

export const formatMediaDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const kindLabel = (rk: AttachmentKind): string => {
  if (rk === 'gif') return 'GIF';
  if (rk === 'video') return 'Video';
  if (rk === 'image') return 'Image';
  if (rk === 'audio') return 'Audio';
  return 'File';
};

export const kindBadgeClass = (rk: AttachmentKind): string => {
  if (rk === 'gif') return 'bg-purple-500/25 text-purple-200 ring-purple-400/30';
  if (rk === 'video') return 'bg-blue/25 text-blue-100 ring-blue/30';
  if (rk === 'image') return 'bg-green/20 text-green-100 ring-green/25';
  return 'bg-white/15 text-white/80 ring-white/20';
};

export const attachmentSectionTitle = (kindFilter: AttachmentKindFilter): string => {
  if (kindFilter === 'images') return 'Images';
  if (kindFilter === 'videos') return 'Videos';
  if (kindFilter === 'gifs') return 'GIFs';
  if (kindFilter === 'links') return 'Links';
  if (kindFilter === 'docs') return 'Documents';
  return 'All Media';
};

export const attachmentEmptyStateImage = (kindFilter: AttachmentKindFilter): string => {
  if (kindFilter === 'gifs') return '/images/no-gif.svg';
  if (kindFilter === 'links') return '/images/no-link.svg';
  if (kindFilter === 'docs') return '/images/no-documents.svg';
  return '/images/no-media.svg';
};

export const attachmentEmptyStateTitle = (
  kindFilter: AttachmentKindFilter,
  senderName?: string,
): string => {
  if (senderName) return `Nothing from ${senderName}`;
  if (kindFilter === 'links') return 'No links found';
  if (kindFilter === 'docs') return 'No documents found';
  if (kindFilter === 'gifs') return 'No GIFs found';
  return 'No media found';
};

export const attachmentEmptyStateSubtitle = (
  kindFilter: AttachmentKindFilter,
  hasSearch: boolean,
): string => {
  if (hasSearch) return 'Try a different search term';
  if (kindFilter === 'images') return 'No images have been shared yet';
  if (kindFilter === 'videos') return 'No videos have been shared yet';
  if (kindFilter === 'gifs') return 'No GIFs have been shared yet';
  if (kindFilter === 'links') return 'No links have been shared in any chat';
  if (kindFilter === 'docs') return 'No documents have been shared yet';
  return 'No media has been shared yet';
};

export const flattenAttachmentItems = (
  pages: AdminAttachmentsPage[],
  kindFilter: AttachmentKindFilter,
): FlatItem[] =>
  pages
    .flatMap((p) => p.messages)
    .flatMap((msg) =>
      msg.attachments
        .filter((att) => matchesKind(att, kindFilter))
        .map((att) => ({
          key: `${msg._id}-${att.publicId ?? att.url}`,
          att,
          msg,
          rk: resolveAttachmentKind(att),
        })),
    );

export const filterMediaItems = (
  flatItems: FlatItem[],
  kindFilter: AttachmentKindFilter,
): FlatItem[] => {
  if (kindFilter === 'images') return flatItems.filter((i) => i.rk === 'image');
  if (kindFilter === 'videos') return flatItems.filter((i) => i.rk === 'video');
  if (kindFilter === 'gifs') return flatItems.filter((i) => i.rk === 'gif');
  return flatItems.filter((i) => i.rk === 'image' || i.rk === 'video' || i.rk === 'gif');
};

export const filterDocItems = (flatItems: FlatItem[]): FlatItem[] =>
  flatItems.filter((i) => i.rk === 'doc');

export const buildLinkItems = (
  pages: AdminAttachmentsPage[],
  kindFilter: AttachmentKindFilter,
): LinkItem[] => {
  if (kindFilter !== 'links') return [];
  return pages
    .flatMap((p) => p.messages)
    .flatMap((msg) =>
      extractUrls(msg.content).map((url) => ({
        key: `${msg._id}-${url}`,
        url,
        msg,
      })),
    );
};

export const showsMediaSection = (kindFilter: AttachmentKindFilter): boolean =>
  kindFilter === 'all' || kindFilter === 'images' || kindFilter === 'videos' || kindFilter === 'gifs';

export const showsDocsSection = (kindFilter: AttachmentKindFilter): boolean =>
  kindFilter === 'all' || kindFilter === 'docs';

export const showsLinksSection = (kindFilter: AttachmentKindFilter): boolean =>
  kindFilter === 'links';
