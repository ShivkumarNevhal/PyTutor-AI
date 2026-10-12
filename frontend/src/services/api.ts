import type { BackendStatus, UploadResponse, Citation, TokenMetrics } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface PredictResponse {
  answer: string;
  citations?: Citation[];
  cached?: boolean;
  fast_route?: string | null;
  tokens?: TokenMetrics;
  latency_ms?: number;
}

export async function checkBackendHealth(): Promise<BackendStatus> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${API_BASE_URL}/`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { online: false };
    }
    const data = await res.json();
    return {
      online: true,
      ...data,
    };
  } catch {
    return { online: false };
  }
}

export async function fetchEnterpriseStats(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/stats`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchDocumentList(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/documents`);
    if (!res.ok) return ['python_ebook.pdf'];
    const data = await res.json();
    return data.documents || ['python_ebook.pdf'];
  } catch {
    return ['python_ebook.pdf'];
  }
}

export async function postChatMessage(
  query: string,
  history: { role: string; content: string }[]
): Promise<PredictResponse> {
  const payload = {
    query,
    history: history.map((h) => ({
      role: h.role,
      content: h.content,
    })),
  };

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = `Error ${response.status}: Failed to get answer`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) errorDetail = errorJson.detail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function uploadPdfDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = `Upload failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) errorDetail = errorJson.detail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
