import { create } from 'zustand';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role: 'user' | 'admin';
  avatar_url: string | null;
  created_at: string;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}));
