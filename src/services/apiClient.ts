import { tursoService } from './tursoService';
import { isJsonResponse } from './apiResponseUtils';

export { isJsonResponse };

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
