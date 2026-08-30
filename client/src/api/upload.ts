import { api } from '@/api/client';
import type { PresignedUploadParams } from '@/types/upload';

type SignUploadFile = { name: string; mimeType: string; size: number };

type SignUploadResponse = {
  success: boolean;
  data: { uploads: PresignedUploadParams[] };
};

/** Request presigned R2 PUT URLs for a batch of files. */
export const signUpload = (
  chatId: string,
  files: SignUploadFile[],
): Promise<SignUploadResponse> =>
  api.post('/upload/sign', { chatId, files }) as Promise<SignUploadResponse>;

/**
 * Upload a single file directly to R2 using the presigned URL.
 *
 * Uses XMLHttpRequest instead of fetch so we can track per-file upload
 * progress via the `progress` event — fetch does not expose upload progress.
 *
 * The Content-Type header MUST match exactly what was locked into the
 * presigned command on the server, otherwise R2 will reject the PUT with 403.
 */
export const directUploadToR2 = (
  file: File,
  params: PresignedUploadParams,
  onProgress?: (percent: number) => void,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`R2 upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    xhr.open('PUT', params.presignedUrl);
    // Content-Type must exactly match what was signed on the server
    xhr.setRequestHeader('Content-Type', params.mimeType);
    xhr.send(file);
  });
