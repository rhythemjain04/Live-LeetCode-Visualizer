import { useState } from 'react';
import { apiUrl } from '@/lib/api';

interface AuthState {
  isAuthenticated: boolean;
  user: string | null;
}

export const useAuth = () => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const stored = localStorage.getItem('algoviz_auth');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { isAuthenticated: false, user: null };
      }
    }
    return { isAuthenticated: false, user: null };
  });

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        const state = { isAuthenticated: true, user: data.name || data.email };
        localStorage.setItem('algoviz_auth', JSON.stringify(state));
        setAuth(state);
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid credentials' };
    } catch {
      // Fallback: client-side demo auth if backend is down
      if (email === 'demo@algo.viz' && password === 'password') {
        const state = { isAuthenticated: true, user: 'Demo User' };
        localStorage.setItem('algoviz_auth', JSON.stringify(state));
        setAuth(state);
        return { success: true };
      }
      return { success: false, error: 'Server unavailable. Try demo@algo.viz / password' };
    }
  };

  const register = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (data.success) {
        const state = { isAuthenticated: true, user: data.name || data.email };
        localStorage.setItem('algoviz_auth', JSON.stringify(state));
        setAuth(state);
        return { success: true };
      }
      return { success: false, error: data.error || 'Registration failed' };
    } catch {
      return { success: false, error: 'Server unavailable' };
    }
  };

  const logout = () => {
    localStorage.removeItem('algoviz_auth');
    setAuth({ isAuthenticated: false, user: null });
  };

  return {
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    login,
    register,
    logout,
  };
};
