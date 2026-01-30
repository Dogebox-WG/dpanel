import ApiClient from '/api/client.js';
import { store } from '/state/store.js';

const client = new ApiClient(store.networkContext.apiBaseUrl);

export async function getRemovableMounts() {
  return client.get('/system/removable-mounts');
}

export async function startBackup({ target, destinationPath }) {
  return client.post('/system/backup', {
    target,
    destinationPath,
  });
}

export async function startRestoreFromPath(sourcePath) {
  return client.post('/system/restore', { sourcePath });
}

export async function uploadRestore(file) {
  const { apiBaseUrl, token } = store.networkContext;
  const url = new URL('/system/restore', apiBaseUrl).href;
  const formData = new FormData();
  formData.append('backup', file);

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status}`);
  }
  return response.json();
}

export async function downloadBackup(jobId) {
  const { apiBaseUrl, token } = store.networkContext;
  const url = new URL(`/system/backup/download/${jobId}`, apiBaseUrl).href;
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }
  return response.blob();
}
