import { create } from 'zustand';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const storedToken = localStorage.getItem('auth_token');

  return {
    token: storedToken,
    isAuthenticated: !!storedToken,
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
