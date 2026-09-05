import ImagesIcon from '@/components/ui/icons/Images';
import VideosIcon from '@/components/ui/icons/Video';
import AudiosIcon from '@/components/ui/icons/Audio';
import FilesIcon from '@/components/ui/icons/FilesIcon';

export type UploadLimits = { individual: number; cumulative: number };
export type UploadTypeConfig = { title: string; accept: string; Icon: typeof ImagesIcon; limits: UploadLimits };

const MB20  = 20  * 1024 * 1024;
const MB100 = 100 * 1024 * 1024;
const MB500 = 500 * 1024 * 1024; // 5 × 100 MB

export const UPLOAD_TYPES: Record<string, UploadTypeConfig> = {
  IMAGES:    { title: 'Images',    accept: 'image/jpeg, image/png, image/gif', Icon: ImagesIcon, limits: { individual: MB20,  cumulative: MB100 } },
  VIDEOS:    { title: 'Videos',    accept: 'video/mp4, video/quicktime',        Icon: VideosIcon, limits: { individual: MB100, cumulative: MB500 } },
  AUDIOS:    { title: 'Audios',    accept: 'audio/mpeg, audio/wav, audio/ogg',  Icon: AudiosIcon, limits: { individual: MB20,  cumulative: MB100 } },
  DOCUMENTS: { title: 'Documents', accept: '*',                                 Icon: FilesIcon,  limits: { individual: MB20,  cumulative: MB100 } },
};
