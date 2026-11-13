import { useAuthStore } from '@/store/authStore';
import { signInWithGoogle, signOut as authSignOut } from '@services/auth.service';

/**
 * useAuth - 인증 관련 상태와 함수를 제공하는 훅
 *
 * 주의: 인증 상태 구독은 AuthProvider에서 한 번만 실행됩니다.
 * 이 훅은 상태를 읽고 로그인/로그아웃 함수를 제공하는 용도로만 사용됩니다.
 */
export const useAuth = () => {
  const { user, isLoading, isAuthenticated, error, setLoading, setError, logout } = useAuthStore();

  const signIn = async () => {
    try {
      setLoading(true);
      setError(null); // 에러 초기화

      // 이전 상태 정리 (선택 사항: 로그아웃 후 로그인 시도)
      // logout();

      const { data, error } = await signInWithGoogle();
      if (error) {
        setError(error);
        return { error };
      }

      // OAuth 리다이렉트 성공 (실제 로그인은 콜백에서 처리)
      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Signing out...');
      setLoading(true);

      // 1. 서비스 레이어에서 로그아웃 (로컬 스토리지/쿠키 클리어 + Supabase 로그아웃)
      const { error } = await authSignOut();

      if (error) {
        console.error('❌ Sign out error (but proceeding with local cleanup):', error);
      }

      // 2. 명시적으로 Zustand 상태 초기화 (onAuthStateChange에만 의존하지 않음)
      console.log('🧹 Forcing local state cleanup...');
      logout();

      console.log('✅ Sign out process completed');
      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로그아웃 중 오류가 발생했습니다.';
      console.error('❌ Sign out exception:', errorMessage);

      // 예외가 발생해도 강제로 상태 초기화
      logout();

      setError(errorMessage);
      setLoading(false);
      return { error: errorMessage };
    }
  };

  const clearError = () => setError(null);

  const isStudent = user?.type === 'student';
  const isAdmin = user?.type === 'admin';
  const isTeacher = user?.type === 'teacher' || user?.type === 'admin'; // admin도 teacher 권한 포함

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    isStudent,
    isTeacher,
    isAdmin,
    signIn,
    signOut,
    clearError,
    setLoading,
  };
};
