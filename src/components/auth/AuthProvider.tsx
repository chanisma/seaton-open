import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getCurrentUser } from '@services/auth.service';
import { supabase } from '@/lib/supabase';
import { PROFILE_CACHE_TTL_MS } from '@utils/constants';

/**
 * AuthProvider - 앱 전체의 인증 상태를 관리하는 Provider
 *
 * 이벤트 기반 인증 확인:
 * - persist된 프로필이 TTL 내면 → DB 조회 없이 세션 유효성만 확인
 * - 프로필이 없거나 TTL이 지났으면 → DB 조회로 갱신
 * - onAuthStateChange로 로그아웃/토큰 만료 감지
 * - SIGNED_IN은 AuthCallback에서 처리하므로 여기서 무시
 *
 * 프로필을 무기한 캐시하면 진급해도 user.meta의 학년/반이 옛날 값으로 남는다.
 * 세션은 리프레시 토큰으로 계속 연장되므로 재로그인만으로는 갱신을 보장할 수 없다.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, userFetchedAt, setUser, setLoading, logout } = useAuthStore();
  const isCheckingRef = useRef(false); // 동시 실행 방지

  useEffect(() => {
    // DB 조회를 포함한 전체 인증 확인 (최초 1회 또는 필요 시에만 실행)
    const checkAuth = async () => {
      // 이미 실행 중이면 중복 호출 방지
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        const currentUser = await getCurrentUser();

        if (currentUser) {
          setUser(currentUser);
          return;
        }

        // 프로필 갱신에 실패해도 세션이 살아있으면 캐시된 프로필을 유지한다.
        // 일시적인 조회 실패로 로그인 상태까지 잃지 않도록.
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session && user) return;

        logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
        isCheckingRef.current = false;
      }
    };

    const isProfileFresh = !!userFetchedAt && Date.now() - userFetchedAt < PROFILE_CACHE_TTL_MS;

    // 캐시된 프로필이 아직 유효하면 → DB 조회 스킵, 세션 유효성만 확인
    if (user && isProfileFresh) {
      setLoading(false);
      // 세션이 실제로 유효한지만 확인 (Auth API만, DB 쿼리 없음)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          logout();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
      });
    } else {
      // 캐시가 없거나 만료됨 → resource에서 최신 프로필을 다시 읽는다.
      // 캐시된 user가 있으면 그대로 렌더되므로 화면 깜빡임 없이 갱신된다.
      checkAuth();
    }

    // Supabase Auth 상태 변경 구독 (로그아웃/토큰 만료 즉시 감지)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      // SIGNED_IN: AuthCallback에서 이미 처리하므로 여기서 중복 호출하지 않음
      // TOKEN_REFRESHED: 토큰 갱신은 Supabase 클라이언트가 자동 처리, DB 조회 불필요
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 마운트 시 한 번만 실행

  return <>{children}</>;
};
