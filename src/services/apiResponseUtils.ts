/**
 * Helper to check if a fetch Response is successful and returned a JSON payload
 */
export function isJsonResponse(res: Response): boolean {
  if (!res.ok) return false;
  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json');
}
