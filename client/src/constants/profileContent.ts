import type { ComponentType } from 'react';
import type { IconProps } from '@/types';
import type { SharedContentTab, PhotoFilter } from '@/components/profile/shared-content/types';
import ImagesIcon from '@/components/ui/icons/Images';
import FilesIcon from '@/components/ui/icons/FilesIcon';
import LinkIcon from '@/components/ui/icons/Link';
import GridAllIcon from '@/components/ui/icons/GridAll';
import VideosIcon from '@/components/ui/icons/Video';
import AudiosIcon from '@/components/ui/icons/Audio';

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
