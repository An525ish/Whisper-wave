export type SignedUploadParams = {
  publicId: string;
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
};

export type UploadFileProgress = {
  file: File;
  /** 0–100 */
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
};
