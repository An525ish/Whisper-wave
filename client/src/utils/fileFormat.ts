import pdfIcon from '@/assets/doc-Icons/pdf.svg';
import docIcon from '@/assets/doc-Icons/doc.svg';
import pptIcon from '@/assets/doc-Icons/ppt.svg';
import csvIcon from '@/assets/doc-Icons/csv.svg';
import xlsIcon from '@/assets/doc-Icons/xls.svg';
import zipIcon from '@/assets/doc-Icons/zip.svg';
import txtIcon from '@/assets/doc-Icons/txt.svg';
import defaultIcon from '@/assets/doc-Icons/default.svg';

export type FileFormatKind =
  | 'image'
  | 'video'
  | 'audio'
  | 'doc'
  | 'xls'
  | 'pdf'
  | 'text'
  | 'unknown';

export type FileDocType =
  | 'unknown'
  | 'pdf'
  | 'doc'
  | 'xls'
  | 'txt'
  | 'ppt'
  | 'zip'
  | 'csv';

export type FileDataItem = {
  id: number;
  icon: string;
  docType: FileDocType;
};

const extensionMap: Record<string, FileFormatKind> = {
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  bmp: 'image',
  svg: 'image',
  mp4: 'video',
  avi: 'video',
  mov: 'video',
  wmv: 'video',
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  doc: 'doc',
  docx: 'doc',
  xls: 'xls',
  xlsx: 'xls',
  pdf: 'pdf',
  txt: 'text',
  // Add more mappings as needed
};

export const fileFormat = (url = ''): FileFormatKind => {
  const clean = url.split('?')[0]?.split('#')[0] ?? '';
  const segment = clean.split('/').pop() ?? '';
  const fileExtension = segment.includes('.')
    ? (segment.split('.').pop() ?? '')
    : segment;

  return extensionMap[fileExtension.toLowerCase()] ?? 'unknown';
};

/**
 * Canonical attachment kind — superset of FileFormatKind for display logic.
 * 'gif' is kept separate from 'image' so callers can skip Cloudinary transforms
 * (which strip animation) and show a GIF badge.
 */
export type AttachmentKind = 'image' | 'video' | 'gif' | 'audio' | 'doc';

/**
 * Resolve the display kind of a stored attachment.
 *
 * Accepts either `fileType` (DB value: 'media' | 'document' | full MIME) or
 * `type` (browser File.type MIME, used in optimistic/pending chat attachments)
 * so this function works in both the admin panel and the chat UI.
 *
 * Detection order:
 *  1. GIF: MIME 'image/gif' OR .gif extension (must precede generic image check)
 *  2. Full MIME prefix (e.g. Klip-sourced attachments that store the real MIME)
 *  3. Upload-middleware values: 'media' → differentiate by Cloudinary URL path
 *     'document' → doc
 *  4. Extension fallback via fileFormat()
 */
const AUDIO_EXT = /\.(mp3|wav|ogg|aac|m4a|flac|wma)$/i;

export const resolveAttachmentKind = (att: {
  fileType?: string;
  type?: string;    // browser File.type (chat optimistic render)
  url?: string;
  name?: string;
}): AttachmentKind => {
  const ft = att.fileType ?? att.type ?? '';
  const name = att.name ?? '';
  const url = att.url ?? '';

  // 1. GIF
  if (/^image\/gif$/i.test(ft) || /\.gif$/i.test(name)) return 'gif';

  // 2. Full MIME type (browser File.type or Klip-sourced fileType)
  if (ft.startsWith('image/')) return 'image';
  if (ft.startsWith('video/')) return 'video';
  if (ft.startsWith('audio/')) return 'audio';

  // 3. Upload-middleware stored values
  if (ft === 'media') {
    if (/\/image\/upload\//i.test(url)) return 'image';
    if (/\/video\/upload\//i.test(url)) return AUDIO_EXT.test(name) ? 'audio' : 'video';
    return 'doc';
  }
  if (ft === 'document') return 'doc';

  // 4. Extension fallback
  const fmt = fileFormat(name || url);
  if (fmt === 'image') return 'image';
  if (fmt === 'video') return 'video';
  if (fmt === 'audio') return 'audio';
  return 'doc';
};

export const getMediaKindFromFile = (file?: {
  url?: string;
  name?: string;
  fileType?: string;
}): 'image' | 'video' | 'audio' => {
  if (!file?.url) return 'image';

  const url = file.url.toLowerCase();
  if (url.includes('/video/upload/')) return 'video';

  const fromName = fileFormat(file.name);
  if (fromName === 'video' || fromName === 'audio' || fromName === 'image') {
    return fromName;
  }

  const fromUrl = fileFormat(file.url);
  if (fromUrl === 'video' || fromUrl === 'audio') return fromUrl;

  return 'image';
};

const extractNameFromUrl = (url?: string): string | undefined => {
  if (!url) return undefined;

  try {
    const clean = url.split('?')[0]?.split('#')[0] ?? '';
    const segment = decodeURIComponent(clean.split('/').pop() ?? '').trim();
    if (!segment) return undefined;

    const withoutVersion = segment.replace(/^v\d+$/i, '');
    if (!withoutVersion) return undefined;

    return withoutVersion;
  } catch {
    return undefined;
  }
};

/** Best-effort label: stored name → URL segment → public id → kind fallback. */
export const getMediaDisplayName = (file?: {
  name?: string;
  url?: string;
  publicId?: string;
  fileType?: string;
}): string => {
  const trimmedName = file?.name?.trim();
  if (trimmedName) return trimmedName;

  const fromUrl = extractNameFromUrl(file?.url);
  if (fromUrl) return fromUrl;

  const publicId = file?.publicId?.trim();
  if (publicId) {
    const segment = publicId.split('/').pop();
    if (segment) return segment;
  }

  const kind = getMediaKindFromFile(file);
  if (kind === 'video') return 'Video';
  if (kind === 'audio') return 'Audio';
  return 'Photo';
};

export const fileData: FileDataItem[] = [
  {
    id: 1,
    icon: defaultIcon,
    docType: 'unknown',
  },
  {
    id: 2,
    icon: pdfIcon,
    docType: 'pdf',
  },
  {
    id: 3,
    icon: docIcon,
    docType: 'doc',
  },
  {
    id: 4,
    icon: xlsIcon,
    docType: 'xls',
  },
  {
    id: 5,
    icon: txtIcon,
    docType: 'txt',
  },
  {
    id: 6,
    icon: pptIcon,
    docType: 'ppt',
  },
  {
    id: 7,
    icon: zipIcon,
    docType: 'zip',
  },
  {
    id: 8,
    icon: csvIcon,
    docType: 'csv',
  },
];

export const transformImage = (url = '', width = 100): string => {
  if (!url || !url.includes('/upload/')) return url;
  // f_auto  → WebP/AVIF where supported (30–70% smaller than JPEG/PNG)
  // q_auto  → Cloudinary's perceptual quality optimiser
  // dpr_auto → serve 2x on retina without double the declared width
  // w_{n}   → resize to the actual display slot
  return url.replace('/upload/', `/upload/f_auto,q_auto,dpr_auto,w_${width}/`);
};
