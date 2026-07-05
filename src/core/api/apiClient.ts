/**
 * Sanctum API Client
 *
 * Centralized fetch wrapper for all backend sync calls.
 * Handles auth headers, error normalization, and retries.
 *
 * The client NEVER sends plaintext content — only encrypted blobs.
 */

import { API_BASE_URL } from '../constants/api';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  headers?: Record<string, string>;
  body?: string | Uint8Array;
  signal?: AbortSignal;
}

interface ApiError {
  status: number;
  message: string;
}

class SanctumApiError extends Error {
  status: number;
  constructor({ status, message }: ApiError) {
    super(message);
    this.name = 'SanctumApiError';
    this.status = status;
  }
}

let _userId: string | null = null;
let _token: string | null = null;

/**
 * Configure the API client with the user's auth credentials.
 * Call this after unlock, before any sync operations.
 */
export function configureApiClient(userId: string, token: string) {
  _userId = userId;
  _token = token;
}

export function clearApiClient() {
  _userId = null;
  _token = null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!_userId || !_token) {
    throw new SanctumApiError({ status: 401, message: 'API client not configured — call configureApiClient() first' });
  }

  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${_token}`,
    'X-Sanctum-User-Id': _userId,
    ...(options.headers ?? {}),
  };

  if (options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  } else if (options.body instanceof Uint8Array) {
    headers['Content-Type'] = 'application/octet-stream';
  }

  const body: BodyInit | undefined =
    options.body instanceof Uint8Array
      ? options.body.buffer as ArrayBuffer
      : options.body;

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body,
    signal: options.signal,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const json = (await response.json()) as { error?: string };
      message = json.error ?? message;
    } catch {}
    throw new SanctumApiError({ status: response.status, message });
  }

  return response.json() as Promise<T>;
}

// ── Sync API calls ────────────────────────────────────────────────────────────

/** Push encrypted manifest to server */
export async function pushManifest(encryptedManifest: string): Promise<void> {
  await request('/sync/push', {
    method: 'POST',
    body: JSON.stringify({ manifest: encryptedManifest }),
  });
}

/** Pull encrypted manifest from server */
export async function pullManifest(): Promise<string | null> {
  const userId = _userId!;
  const data = await request<{ manifest: string | null }>(`/sync/pull/${userId}`);
  return data.manifest;
}

/** Upload an encrypted blob. Returns the server-assigned blobId. */
export async function uploadBlob(
  encryptedBytes: Uint8Array,
  filename: string,
): Promise<string> {
  const data = await request<{ blobId: string }>('/sync/blob', {
    method: 'POST',
    headers: { 'X-Blob-Filename': filename },
    body: encryptedBytes,
  });
  return data.blobId;
}

/** Download an encrypted blob by blobId */
export async function downloadBlob(blobId: string): Promise<Uint8Array> {
  const url = `${API_BASE_URL}/sync/blob/${blobId}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${_token}`,
      'X-Sanctum-User-Id': _userId!,
    },
  });
  if (!response.ok) {
    throw new SanctumApiError({ status: response.status, message: 'Failed to download blob' });
  }
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

/** List all blob IDs for this user */
export async function listBlobs(): Promise<{ blobId: string; filename: string; sizeBytes: number }[]> {
  const data = await request<{ blobs: { blobId: string; filename: string; sizeBytes: number }[] }>('/sync/blobs');
  return data.blobs;
}

/** Delete a blob by blobId */
export async function deleteBlob(blobId: string): Promise<void> {
  await request(`/sync/blob/${blobId}`, { method: 'DELETE' });
}

/** Delete all user data from server */
export async function deleteUserData(): Promise<void> {
  const userId = _userId!;
  await request(`/sync/user/${userId}`, { method: 'DELETE' });
}

/** Get an AI reframe for a goal attempt */
export async function getReframe(notes: string): Promise<string> {
  const data = await request<{ reframe: string }>('/sync/ai/reframe', {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
  return data.reframe;
}

export { SanctumApiError };
