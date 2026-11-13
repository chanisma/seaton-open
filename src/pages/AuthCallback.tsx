import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { getUserProfile } from '@services/auth.service';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore(state => state.setUser);
  const setError = useAuthStore(state => state.setError);
  const [status, setStatus] = useState<string>('인증 처리 중...');

  useEffect(() => {
    let mounted = true;

    const handleAuth = async (session: any) => {
      if (!mounted) return;

      try {
        setStatus('세션 확인 완료. 프로필 조회 중...');
        console.log('🔄 Processing auth session...');

        if (!session?.user?.email) {
          throw new Error('No user email found in session');
        }

        console.log('✅ Session found:', session.user.email);

        // 2. 사용자 프로필 조회
        const profile = await getUserProfile(session.user.email);

        if (!profile) {
          console.error('❌ Profile not found');
          throw new Error('사용자 프로필을 찾을 수 없습니다.');
        }

        setStatus('프로필 로드 완료. 이동 중...');
        console.log('✅ Profile loaded:', profile);

        // 3. 상태 저장
        setUser(profile);

        // 4. 대시보드로 리디렉션
        if (profile.type === 'student') {
          navigate('/student', { replace: true });
        } else {
          navigate('/teacher', { replace: true });
        }
      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        const message = error instanceof Error ? error.message : '로그인에 실패했습니다.';
        setStatus(`오류 발생: ${message}`);
        setError(message);

        // 에러 발생 시 로그인 페이지로 리디렉션
        setTimeout(() => {
          if (mounted) navigate('/login', { replace: true });
        }, 3000);
      }
    };

    // Supabase Auth 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      if (event === 'SIGNED_IN' && session) {
        handleAuth(session);
      }
    });

    // 초기 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleAuth(session);
      } else {
        // 세션이 없고 해시가 있는 경우 (Supabase가 아직 처리 못했을 수 있음)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          setStatus('토큰 처리 중...');
          // 잠시 대기 후 다시 확인 (Supabase client가 처리할 시간 부여)
          setTimeout(() => {
            supabase.auth.getSession().then(({ data: { session: retrySession } }) => {
              if (retrySession) {
                handleAuth(retrySession);
              } else {
                setStatus('세션 생성 실패. 다시 시도해주세요.');
                setTimeout(() => navigate('/login', { replace: true }), 2000);
              }
            });
          }, 1000);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, setUser, setError]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-primary-50 via-background to-primary-100 dark:from-primary-950 dark:via-background dark:to-primary-900/40">
      <div className="text-center p-8 bg-card text-card-foreground border border-border/70 rounded-2xl shadow-overlay max-w-md w-full">
        <LoadingSpinner size="lg" />
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
          로그인 처리 중
        </h2>
        <p className="mt-2 text-muted-foreground font-medium">{status}</p>
        <p className="mt-2 text-sm text-muted-foreground">잠시만 기다려주세요...</p>
      </div>
    </div>
  );
};
