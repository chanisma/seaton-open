import { supabase } from '@/lib/supabase';
import { User, UserType } from '@project-types/user.types';
import { ALLOWED_EMAIL_DOMAIN, ERROR_MESSAGES } from '@utils/constants';
import { isValidEmailDomain, isStudentEmail, isBlockedEmail } from '@utils/validation';
import { withTimeout } from '@utils/promiseHelpers';

/**
 * Google OAuth 로그인
 */
export const signInWithGoogle = async (): Promise<{ data: any; error: string | null }> => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false, // 명시적으로 리다이렉트 수행
        queryParams: {
          access_type: 'offline', // 리프레시 토큰 확보
          prompt: 'consent', // 항상 동의 화면 표시 (선택 사항)
          hd: ALLOWED_EMAIL_DOMAIN, // 도메인 제한
        },
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Google login error:', error);
    return { data: null, error: ERROR_MESSAGES.AUTH.LOGIN_FAILED };
  }
};

/**
 * 로그아웃 (로컬 세션 먼저 클리어, Supabase는 백그라운드)
 */
export const signOut = async (): Promise<{ error: string | null }> => {
  // 1단계: 모든 클라이언트 저장소 즉시 클리어 (동기적)
  try {
    // 1-1. localStorage 클리어
    const localKeys = Object.keys(localStorage);
    localKeys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key);
      }
    });

    // 1-2. sessionStorage 클리어
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        sessionStorage.removeItem(key);
      }
    });

    // 1-3. Supabase 관련 쿠키 삭제 시도
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const [name] = cookie.split('=');
        const trimmedName = name.trim();
        if (
          trimmedName.startsWith('sb-') ||
          trimmedName.includes('supabase') ||
          trimmedName.includes('auth')
        ) {
          // 쿠키 삭제 (모든 경로와 도메인에 대해)
          document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
        }
      });
    }
  } catch (storageError) {
    console.error('Failed to clear storage:', storageError);
  }

  // 2단계: Supabase 서버 세션 종료 (타임아웃 3초)
  try {
    await withTimeout(supabase.auth.signOut(), 3000, 'Sign out timed out');
  } catch (error) {
    // Silent fail - local session already cleared
    console.warn('Supabase sign out warning:', error);
  }

  return { error: null };
};

/**
 * 현재 사용자 세션 가져오기
 */
export const getCurrentSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    console.error('Get session error:', error);
    return { session: null, error };
  }
};

/**
 * 현재 로그인한 사용자 정보 가져오기 (Polling용)
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.email) {
      return null;
    }

    return await getUserProfile(session.user.email);
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
};

/**
 * 이메일로 프로필 조회
 */
const fetchProfileByEmail = async (email: string) => {
  return await supabase.from('profiles').select('*').eq('email', email).single();
};

/**
 * 학생 리소스 조회 (학번 또는 ID로)
 */
interface DBResource {
  id: number;
  name: string;
  type: string | null;
  meta: any; // JSON
}

const fetchStudentResource = async (userId: string): Promise<DBResource | null> => {
  try {
    // 1. meta.id로 검색
    const query1 = supabase.from('resource').select('*').eq('meta->>id', userId);
    let { data: resources, error } = await withTimeout(query1, 10000, 'Resource query timeout');

    // 2. meta.id로 못 찾으면 meta.studentId로 재시도 (레거시 키)
    if ((!resources || resources.length === 0) && !error) {
      const query2 = supabase.from('resource').select('*').eq('meta->>studentId', userId);
      const result = await withTimeout(query2, 10000, 'Resource query timeout');
      resources = result.data;
      error = result.error;
    }

    if (error) throw error;
    return resources && resources.length > 0 ? (resources[0] as unknown as DBResource) : null;
  } catch (error) {
    console.error('Error fetching student resource:', error);
    return null;
  }
};

/**
 * 새 프로필 생성
 */
const createProfile = async (email: string, role: UserType, resource: DBResource | null) => {
  const profileData: any = {
    email,
    role,
    last_login: new Date().toISOString(),
  };

  if (role === 'student' && resource) {
    profileData.name = resource.name || '';
  }

  const { data: newProfile, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single();

  if (error) throw error;
  return newProfile;
};

/**
 * Profiles 테이블에서 사용자 정보 조회
 * - 이미 계정 있음: profiles의 role 사용
 * - 처음 로그인: resource에서 role 결정 후 profiles 생성
 */
export const getUserProfile = async (email: string): Promise<User | null> => {
  try {
    // 이메일 도메인 검증
    if (!isValidEmailDomain(email)) {
      throw new Error(ERROR_MESSAGES.AUTH.INVALID_DOMAIN);
    }

    // 차단된 이메일 검증
    if (isBlockedEmail(email)) {
      console.error('Blocked email attempted login:', email);
      return null;
    }

    // 1. 이메일 형식이 학생 형식이 아닌 경우 -> 교사로 처리
    if (!isStudentEmail(email)) {
      // profiles 테이블 확인
      const { data: profile, error: profileError } = await fetchProfileByEmail(email);

      if (profile && !profileError) {
        // 이미 프로필이 있는 경우
        // 혹시라도 role이 student로 되어있다면 teacher로 업데이트
        if ((profile as any).role === 'student') {
          await supabase
            .from('profiles')
            .update({ role: 'teacher' } as unknown as never)
            .eq('id', (profile as any).id);

          return {
            profile_id: (profile as any).id,
            email: (profile as any).email,
            type: 'teacher' as UserType,
            last_login: (profile as any).last_login,
            name: (profile as any).name,
          };
        }

        return {
          profile_id: (profile as any).id,
          email: (profile as any).email,
          type: (profile as any).role as UserType, // profiles.role 사용 (admin 포함)
          last_login: (profile as any).last_login,
          name: (profile as any).name,
        };
      } else if (profileError?.code === 'PGRST116') {
        // 프로필이 없는 경우 -> 교사 프로필 생성
        const newProfile = await createProfile(email, 'teacher', null);
        return {
          profile_id: (newProfile as any).id,
          email: email,
          type: 'teacher',
          last_login: (newProfile as any).last_login,
          name: (newProfile as any).name,
        };
      } else {
        throw profileError;
      }
    }

    // 2. 학생 이메일 형식인 경우 -> 기존 로직 수행 (profiles 확인 -> resource 확인)

    // 2-1. profiles 테이블에서 조회
    const { data: profile, error: profileError } = await fetchProfileByEmail(email);

    // 2-2. 이미 계정이 있는 경우 (profiles에 레코드 존재)
    if (profile && !profileError) {
      // student인 경우에만 resource 정보 조회
      if ((profile as any).role === 'student') {
        const userId = email.split('@')[0];
        const resource = await fetchStudentResource(userId);

        if (!resource) {
          console.error('Resource not found for student profile');
          return null;
        }

        // profiles에 이름이 없으면 resource.name으로 백필.
        // await하지 않으면 AuthCallback이 곧바로 화면을 전환하면서 요청이 유실되어
        // name이 NULL로 남는다 (2026-08 실제로 학생 36명 발생). 반드시 기다린다.
        if (!(profile as any).name && resource.name) {
          const { error: nameUpdateError } = await supabase
            .from('profiles')
            .update({ name: resource.name } as unknown as never)
            .eq('email', email);

          if (nameUpdateError) {
            console.error('Failed to backfill profile name:', nameUpdateError);
          }
        }

        return {
          profile_id: (profile as any).id,
          email: (profile as any).email,
          type: 'student',
          last_login: (profile as any).last_login,
          id: String(resource.id),
          name: resource.name || '',
          meta: resource.meta,
          created_at: new Date().toISOString(), // DB resource has no created_at, use now or omit
        };
      } else {
        // DB에 teacher로 되어있지만 이메일 형식이 학생인 경우...
        // 일단 DB role을 따르거나, 아니면 여기서 강제로 student로직을 태울 수도 있음.
        // 현재 요구사항은 "형식이 아니면 교사"이므로, "형식이면 학생"으로 보는게 맞지만
        // 기존 DB 데이터와의 호환성을 위해 DB role이 teacher면 teacher로 인정해줄지 결정 필요.
        // 하지만 요구사항의 취지는 "이메일 형식으로 구분"이므로, 학생 형식이면 학생 로직을 타야 함.
        // 다만 기존 로직(2-A)을 그대로 두면 DB role을 우선하게 됨.

        // 여기서는 "학생 이메일 형식이면" 아래 로직을 타게 되는데,
        // 만약 DB에 teacher/admin으로 되어있다면?
        // DB의 role을 그대로 사용

        return {
          profile_id: (profile as any).id,
          email: (profile as any).email,
          type: (profile as any).role as UserType, // profiles.role 사용 (admin 포함)
          last_login: (profile as any).last_login,
          name: (profile as any).name,
        };
      }
    }

    // 2-3. 처음 로그인 (profiles에 레코드 없음)
    if (profileError?.code === 'PGRST116') {
      const userId = email.split('@')[0];
      const resource = await fetchStudentResource(userId);

      // 학생 이메일 형식이지만 리소스가 없는 경우? -> 일단 student로 시도하다가 실패하거나,
      // 리소스가 없으면 가입 불가 처리해야 함 (기존 로직은 teacher로 fallback했었음).
      // 하지만 이제는 "형식이 아니면 교사"이므로, "형식이면 학생"이어야 함.
      // 리소스가 없으면 학생 가입 불가로 처리하는 것이 안전함.

      if (!resource) {
        console.error('Resource not found for new student login');
        return null; // 학생인데 리소스 없으면 로그인 불가
      }

      const role: UserType = 'student';
      const newProfile = await createProfile(email, role, resource);

      return {
        profile_id: (newProfile as any).id,
        email: email,
        type: 'student',
        last_login: (newProfile as any).last_login,
        id: String(resource.id),
        name: resource.name || '',
        meta: resource.meta,
        created_at: new Date().toISOString(),
      };
    }

    // 2-4. 기타 에러
    if (profileError) {
      console.error('Supabase query error:', profileError);
      if (profileError.code === '42501') {
        console.error('RLS Policy Error: Check your Row Level Security policies');
      }
      throw profileError;
    }

    return null;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
};

/**
 * 인증 상태 변경 구독
 */
export const onAuthStateChange = (callback: (user: User | null) => void | Promise<void>) => {
  return supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session?.user) {
      const profile = await getUserProfile(session.user.email!);
      callback(profile);
    } else {
      callback(null);
    }
  });
};
