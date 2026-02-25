import { create } from 'zustand';

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const storedToken = localStorage.getItem('auth_token');
  const isValid = storedToken && !isTokenExpired(storedToken);

  if (storedToken && !isValid) {
    localStorage.removeItem('auth_token');
  }

  return {
    token: isValid ? storedToken : null,
    isAuthenticated: !!isValid,
    setToken: (token: string) => {
      localStorage.setItem('auth_token', token);
      set({ token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('auth_token');
      set({ token: null, isAuthenticated: false });
    },
  };
});
