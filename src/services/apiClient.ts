import { tursoService } from './tursoService';

/**
 * Check if a fetch Response is successful and returned a JSON payload (not SPA HTML rewrite in dev mode)
 */
export function isJsonResponse(res: Response): boolean {
  if (!res.ok) return false;
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json');
}

/**
 * Perform an authenticated API request to the backend Vercel serverless functions
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers: {
        ...tursoService.getApiHeaders(),
        ...options.headers,
      },
    });

    if (isJsonResponse(res)) {
      return (await res.json()) as T;
    }
  } catch (e) {
    // API request failed or offline
  }

  return null;
}
