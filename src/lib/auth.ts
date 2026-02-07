// Authentication helpers

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

const AUTH_KEY = 'meeting_diary_auth';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const USE_DEV_MODE = !API_BASE_URL || process.env.NODE_ENV === 'development';

// Development mode credentials
const DEV_ADMIN = {
  id: 'admin-001',
  name: 'Administrator',
  email: 'admin@meetings.com',
  password: 'Admin123!',
  role: 'admin' as const,
};

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(AUTH_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

export async function login(email: string, password: string): Promise<AuthUser> {
  // Development mode - use local credentials
  if (USE_DEV_MODE) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (email === DEV_ADMIN.email && password === DEV_ADMIN.password) {
      const user: AuthUser = {
        id: DEV_ADMIN.id,
        name: DEV_ADMIN.name,
        email: DEV_ADMIN.email,
        role: DEV_ADMIN.role,
      };
      setStoredUser(user);
      return user;
    }
    throw new Error('Invalid email or password');
  }

  // Production mode - call PHP API
  const response = await fetch(`${API_BASE_URL}/api/auth.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, password }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.message || 'Login failed');
  }

  const user: AuthUser = {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: data.user.role || 'user',
  };

  setStoredUser(user);
  return user;
}

export function logout(): void {
  setStoredUser(null);
}

export function isAuthenticated(): boolean {
  return getStoredUser() !== null;
}
