import ImagesIcon from '@/components/ui/icons/Images';
import VideosIcon from '@/components/ui/icons/Video';
import AudiosIcon from '@/components/ui/icons/Audio';
import FilesIcon from '@/components/ui/icons/FilesIcon';

export type UploadLimits = { individual: number; cumulative: number };
export type UploadTypeConfig = { title: string; accept: string; Icon: typeof ImagesIcon; limits: UploadLimits };

export const UPLOAD_TYPES: Record<string, UploadTypeConfig> = {
  IMAGES: { title: 'Images', accept: 'image/jpeg, image/png, image/gif', Icon: ImagesIcon, limits: { individual: 5 * 1024 * 1024, cumulative: 20 * 1024 * 1024 } },
  VIDEOS: { title: 'Videos', accept: 'video/mp4, video/quicktime', Icon: VideosIcon, limits: { individual: 50 * 1024 * 1024, cumulative: 250 * 1024 * 1024 } },
  AUDIOS: { title: 'Audios', accept: 'audio/mpeg, audio/wav, audio/ogg', Icon: AudiosIcon, limits: { individual: 20 * 1024 * 1024, cumulative: 100 * 1024 * 1024 } },
  DOCUMENTS: { title: 'Documents', accept: '*', Icon: FilesIcon, limits: { individual: 50 * 1024 * 1024, cumulative: 150 * 1024 * 1024 } },
};
