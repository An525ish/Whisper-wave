export type MediaFile = {
  _id?: string;
  publicId?: string;
  name?: string;
  url?: string;
  fileType?: string;
};

export type SharedLink = {
  url: string;
  host: string;
  messageId: string;
};

export type PhotoFilter = 'all' | 'image' | 'video' | 'audio';
