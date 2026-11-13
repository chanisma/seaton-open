import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { Button } from '@components/common/Button';
import { LoadingSpinner } from '@components/common/LoadingSpinner';

export const Login = () => {
  const { isAuthenticated, isLoading, error, signIn, clearError, setLoading } = useAuth();
  const navigate = useNavigate();

  // Login 페이지 마운트 시 로딩 상태 해제
  useEffect(() => {
    console.log('🔑 Login page mounted, clearing loading state');
    setLoading(false);
  }, [setLoading]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // URL 파라미터에서 에러 확인 (OAuth 콜백 실패 시)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    if (errorParam || errorDescription) {
      clearError();
      // URL에서 에러 파라미터 제거
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [clearError]);

  const handleGoogleLogin = async () => {
    clearError(); // 이전 에러 초기화
    await signIn();
  };

  // 로그인 페이지는 public 페이지이므로 로딩 상태 무시
  // 로그인 중일 때만 스피너 오버레이 표시
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-background to-primary-100 dark:from-primary-950 dark:via-background dark:to-primary-900/40 relative overflow-hidden px-4">
      {/* 로딩 오버레이 - 부드러운 전환 */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 ${
          isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isLoading}
      >
        <div className="bg-popover text-popover-foreground p-6 rounded-2xl shadow-overlay border border-border text-center transform transition-transform duration-300 scale-100">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground font-medium" role="status">
            로그인 중...
          </p>
        </div>
      </div>

      <div className="bg-card text-card-foreground border border-border/70 p-8 rounded-2xl shadow-overlay max-w-md w-full animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-primary mb-2">Seaton</h1>
          <p className="text-muted-foreground">학교 열람실 자리 신청 시스템</p>
        </div>

        {/* 에러 메시지 표시 */}
        {error && (
          <div
            className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-xl animate-shake"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-destructive mb-1">로그인 실패</h3>
                <p className="text-sm text-destructive/90">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-destructive/60 hover:text-destructive transition-colors"
                aria-label="에러 메시지 닫기"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            fullWidth
            size="lg"
            className="gap-3 transition-transform active:scale-95"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 로그인
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            @myschool.hs.kr 도메인만 사용 가능합니다
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            학생은 자리 신청 및 확인
            <br />
            교사는 출석 체크 및 통계 조회
          </p>
        </div>
      </div>
    </div>
  );
};
