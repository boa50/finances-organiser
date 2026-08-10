import { authService } from '../authService';

describe('AuthService', () => {
  beforeEach(() => {
    // Reset session before each test
    authService.logout();
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.clear();
    }
  });

  it('should initialize unauthenticated', () => {
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('should logout and clear authentication state', () => {
    authService.logout();
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('should reject login with empty password', async () => {
    const globalFetchBackup = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: false, message: 'Password is required.' }),
    } as any);

    const result = await authService.login('');
    expect(result.success).toBe(false);
    expect(authService.isAuthenticated()).toBe(false);

    global.fetch = globalFetchBackup;
  });

  it('should authenticate successfully when API returns success', async () => {
    const globalFetchBackup = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: true, message: 'Authenticated successfully.' }),
    } as any);

    const result = await authService.login('password');
    expect(result.success).toBe(true);
    expect(authService.isAuthenticated()).toBe(true);

    global.fetch = globalFetchBackup;
  });

  it('should fail authentication when API returns 401', async () => {
    const globalFetchBackup = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: false, message: 'Invalid password. Please try again.' }),
    } as any);

    const result = await authService.login('wrongpassword');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid password');
    expect(authService.isAuthenticated()).toBe(false);

    global.fetch = globalFetchBackup;
  });
});
