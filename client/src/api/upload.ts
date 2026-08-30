import api from '@/api/client';
import type { SignedUploadParams } from '@/types/upload';

export type SignUploadFile = {
  name: string;
  mimeType: string;
  size: number;
};

export type SignUploadResponse = {
  success: boolean;
  data: { uploads: SignedUploadParams[] };
};

export type CloudinaryUploadResponse = {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format: string;
  bytes: number;
  original_filename: string;
};

export const signUpload = (
  chatId: string,
  files: SignUploadFile[],
): Promise<SignUploadResponse> => api.post('/upload/sign', { chatId, files });

/**
 * Upload a single file directly to Cloudinary using server-issued signed params.
 * Uses XMLHttpRequest so progress events are available.
 * The Cloudinary API secret is never sent to the client — only the short-lived signature.
 */
export const directUploadToCloudinary = (
  file: File,
  params: SignedUploadParams,
  onProgress?: (pct: number) => void,
): Promise<CloudinaryUploadResponse> =>
  new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('public_id', params.publicId);
    fd.append('signature', params.signature);
    fd.append('timestamp', String(params.timestamp));
    fd.append('api_key', params.apiKey);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${params.cloudName}/auto/upload`);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText) as CloudinaryUploadResponse);
      } else {
        const body = JSON.parse(xhr.responseText) as { error?: { message?: string } };
        reject(new Error(body.error?.message ?? `Upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));

    xhr.send(fd);
  });
