/**
 * fileService.ts — ZenithRx Cloudflare R2 File Service
 * Handles signed URL requests, direct browser → R2 uploads, and upload confirmation.
 * Clean Architecture: Infrastructure Layer
 *
 * Architecture:
 *   Browser → POST /api/files/upload-url → Server → R2 (get signed URL)
 *   Browser → PUT {signedUrl} (direct upload to R2)
 *   Browser → POST /api/files/upload-complete → Server (register in DB)
 */

export type RetentionClass = 'clinical' | 'financial' | 'export' | 'general';

export interface UploadRequest {
  fileName:        string;
  mimeType:        string;
  fileSizeBytes:   number;
  retentionClass:  RetentionClass;
  referenceType?:  string;
  referenceId?:    string;
}

export interface UploadUrlResponse {
  uploadUrl: string; // Signed PUT URL
  fileId:    string; // Database file record ID
  r2Key:     string; // R2 object key
}

export interface UploadResult {
  fileId:      string;
  r2Key:       string;
  downloadUrl: string;
}

/** Step 1: Request a signed upload URL from the server */
export async function requestUploadUrl(req: UploadRequest): Promise<UploadUrlResponse> {
  const res = await fetch('/api/files/upload-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? `Upload URL request failed: ${res.status}`);
  }
  return res.json() as Promise<UploadUrlResponse>;
}

/** Step 2: Upload the file directly to R2 using the signed URL */
export async function uploadFileToR2(
  signedUrl: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', file.type);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`R2 upload failed: HTTP ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.send(file);
  });
}

/** Step 3: Confirm the upload and activate the file record */
export async function confirmUpload(fileId: string): Promise<{ downloadUrl: string }> {
  const res = await fetch('/api/files/upload-complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error ?? 'Upload confirmation failed');
  }
  return res.json();
}

/** Full pipeline: request URL → upload → confirm */
export async function uploadFile(
  file: File,
  meta: Omit<UploadRequest, 'fileName' | 'mimeType' | 'fileSizeBytes'>,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  // 1. Get signed URL
  const { uploadUrl, fileId, r2Key } = await requestUploadUrl({
    fileName:       file.name,
    mimeType:       file.type,
    fileSizeBytes:  file.size,
    ...meta,
  });

  // 2. Upload directly to R2
  await uploadFileToR2(uploadUrl, file, onProgress);

  // 3. Confirm and get download URL
  const { downloadUrl } = await confirmUpload(fileId);

  return { fileId, r2Key, downloadUrl };
}

/** Request a signed download URL for a stored file */
export async function getDownloadUrl(fileId: string): Promise<string> {
  const res = await fetch('/api/files/download-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId }),
  });
  if (!res.ok) throw new Error('Failed to get download URL');
  const { url } = await res.json() as { url: string };
  return url;
}
