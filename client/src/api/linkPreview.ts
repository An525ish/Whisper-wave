import { api } from '@/api/client';

export type LinkPreviewData = {
  url: string;
  host: string;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
};

type LinkPreviewResponse = { success: boolean; data: LinkPreviewData };

export const fetchLinkPreview = (url: string) =>
  api.get<LinkPreviewResponse>('/link-preview', { url });
