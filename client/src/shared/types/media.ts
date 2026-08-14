export type MediaFile = {
  _id: string;
  url: string;
  name?: string;
  publicId?: string;
  thumbnailUrl?: string;
  fileType?: string;
};

export type MediaKind = 'image' | 'video' | 'audio';

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
