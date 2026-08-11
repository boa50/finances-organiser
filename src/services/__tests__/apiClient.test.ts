import { isJsonResponse } from '../apiClient';

describe('apiClient', () => {
  describe('isJsonResponse', () => {
    it('returns true for ok response with application/json header', () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: (header: string) => (header.toLowerCase() === 'content-type' ? 'application/json; charset=utf-8' : null),
        },
      } as unknown as Response;

      expect(isJsonResponse(mockResponse)).toBe(true);
    });

    it('returns false for ok response with text/html header (SPA rewrite in dev mode)', () => {
      const mockResponse = {
        ok: true,
        headers: {
          get: (header: string) => (header.toLowerCase() === 'content-type' ? 'text/html' : null),
        },
      } as unknown as Response;

      expect(isJsonResponse(mockResponse)).toBe(false);
    });

    it('returns false for non-ok response even with application/json header', () => {
      const mockResponse = {
        ok: false,
        headers: {
          get: (header: string) => (header.toLowerCase() === 'content-type' ? 'application/json' : null),
        },
      } as unknown as Response;

      expect(isJsonResponse(mockResponse)).toBe(false);
    });
  });
});
