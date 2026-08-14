import type { ComponentType } from 'react';
import type { IconProps } from '@/shared/types';
import type { SharedContentTab, PhotoFilter } from '@/features/profile/components/shared-content/types';
import ImagesIcon from '@/shared/components/icons/Images';
import FilesIcon from '@/shared/components/icons/FilesIcon';
import LinkIcon from '@/shared/components/icons/Link';
import GridAllIcon from '@/shared/components/icons/GridAll';
import VideosIcon from '@/shared/components/icons/Video';
import AudiosIcon from '@/shared/components/icons/Audio';

export type TabIcon = ComponentType<IconProps>;

export type SharedContentTabConfig = {
  id: SharedContentTab;
  label: string;
  hint: string;
  Icon: TabIcon;
  strokeOnly?: boolean;
};

export type PhotoFilterConfig = {
  key: PhotoFilter;
  label: string;
  Icon: TabIcon;
  strokeOnly?: boolean;
};

export const SHARED_CONTENT_TABS: SharedContentTabConfig[] = [
  { id: 'photos',      label: 'Images', hint: 'Photos, videos & audio',   Icon: ImagesIcon },
  { id: 'attachments', label: 'Files',  hint: 'Documents & downloads',    Icon: FilesIcon  },
  { id: 'links',       label: 'Links',  hint: 'URLs shared in chat',      Icon: LinkIcon, strokeOnly: true },
];

export const PHOTO_FILTER_OPTIONS: PhotoFilterConfig[] = [
  { key: 'all',   label: 'All',    Icon: GridAllIcon, strokeOnly: true },
  { key: 'image', label: 'Photos', Icon: ImagesIcon },
  { key: 'video', label: 'Videos', Icon: VideosIcon  },
  { key: 'audio', label: 'Audio',  Icon: AudiosIcon  },
];
