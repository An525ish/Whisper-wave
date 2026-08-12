import pdfIcon from '../assets/doc-Icons/pdf.svg';
import docIcon from '../assets/doc-Icons/doc.svg';
import pptIcon from '../assets/doc-Icons/ppt.svg';
import csvIcon from '../assets/doc-Icons/csv.svg';
import xlsIcon from '../assets/doc-Icons/xls.svg';
import zipIcon from '../assets/doc-Icons/zip.svg';
import txtIcon from '../assets/doc-Icons/txt.svg';
import defaultIcon from '../assets/doc-Icons/default.svg';

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
  return url.replace('/upload/', `/upload/dpr_auto/w_${width}/`);
};
