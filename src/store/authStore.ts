import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@project-types/user.types';

interface AuthState {
  user: User | null;
  userFetchedAt: number | null; // user를 DB에서 읽어온 시각 (프로필 캐시 만료 판정용)
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      userFetchedAt: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      setUser: user =>
        set({
          user,
          userFetchedAt: user ? Date.now() : null,
          isAuthenticated: !!user,
          isLoading: false,
          error: null, // 성공 시 에러 초기화
        }),

      setLoading: loading => set({ isLoading: loading }),

      setError: error =>
        set({
          error,
          isLoading: false, // 에러 발생 시 로딩 해제
        }),

      logout: () => {
        console.log('🔓 Clearing auth state...');
        set({
          user: null,
          userFetchedAt: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
        // localStorage 클리어
        localStorage.removeItem('auth-storage');
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        userFetchedAt: state.userFetchedAt,
        isAuthenticated: state.isAuthenticated,
      }),
      // 복원 후 로딩 상태 즉시 해제
      onRehydrateStorage: () => state => {
        if (state && state.user) {
          state.isLoading = false;
        }
      },
    }
  )
);
