export interface AuthResult {
  success: boolean;
  message?: string;
}

const SESSION_KEY = 'financecloud_auth';

// Expo client-side environment variable fallback (for npm run web / local dev without Vercel API)
const ENV_EXPO_PASSWORD = process.env.EXPO_PUBLIC_APP_PASSWORD?.trim() ?? '';

class AuthService {
  private authenticated: boolean = false;

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored === 'true') {
          this.authenticated = true;
        }
      }
    } catch (e) {
      console.warn('Failed to restore auth session:', e);
    }
  }

  private persistSession(): void {
    this.authenticated = true;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(SESSION_KEY, 'true');
      }
    } catch (e) {
      console.warn('Failed to persist auth session:', e);
    }
  }

  public isAuthenticated(): boolean {
    return this.authenticated;
  }

  public async login(password: string): Promise<AuthResult> {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const contentType = res.headers.get('content-type') || '';
      const isJsonPayload = contentType.includes('application/json');
      const data = isJsonPayload ? await res.json().catch(() => ({})) : {};

      // Case 1: Valid API JSON response from /api/auth
      if (typeof data.success === 'boolean') {
        if (res.ok && data.success) {
          this.persistSession();
          return { success: true };
        }
        this.authenticated = false;
        return {
          success: false,
          message: data.message || 'Invalid password. Please try again.',
        };
      }

      // Case 2: Endpoint returned non-JSON (e.g. Metro SPA HTML 200/404 rewrite)
      if (ENV_EXPO_PASSWORD) {
        if (password === ENV_EXPO_PASSWORD) {
          this.persistSession();
          return { success: true };
        }
        this.authenticated = false;
        return {
          success: false,
          message: 'Invalid password. Please try again.',
        };
      }

      // Case 3: Non-JSON response and no EXPO_PUBLIC_APP_PASSWORD configured
      this.authenticated = false;
      return {
        success: false,
        message:
          'API route /api/auth is not active in Metro dev mode. Please restart Metro ("npm start") to load EXPO_PUBLIC_APP_PASSWORD, or run with "npx vercel dev".',
      };
    } catch (e: any) {
      console.warn('Auth API fetch failed, checking local Expo fallback:', e);

      // Network / fetch error fallback
      if (ENV_EXPO_PASSWORD) {
        if (password === ENV_EXPO_PASSWORD) {
          this.persistSession();
          return { success: true };
        }
        this.authenticated = false;
        return {
          success: false,
          message: 'Invalid password. Please try again.',
        };
      }

      this.authenticated = false;
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.',
      };
    }
  }

  public logout(): void {
    this.authenticated = false;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      console.warn('Failed to clear auth session:', e);
    }
  }
}

export const authService = new AuthService();
