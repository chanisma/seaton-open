/**
 * 인증 디버깅 유틸리티
 */

import { supabase } from '@/lib/supabase';

/**
 * Supabase 연결 상태 진단
 */
export const diagnoseSupabaseConnection = async () => {
  console.log('🔍 Diagnosing Supabase connection...');

  const diagnostics = {
    env: {
      url: !!import.meta.env.VITE_SUPABASE_URL,
      anonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    session: null as any,
    network: 'unknown',
    localStorage: [] as string[],
  };

  // 1. 환경 변수 확인
  console.log('1️⃣ Environment variables:', diagnostics.env);

  // 2. 현재 세션 확인
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Session error:', error);
    } else {
      diagnostics.session = {
        hasSession: !!data.session,
        userId: data.session?.user?.id,
        email: data.session?.user?.email,
        expiresAt: data.session?.expires_at,
      };
      console.log('2️⃣ Current session:', diagnostics.session);
    }
  } catch (err) {
    console.error('❌ Failed to get session:', err);
  }

  // 3. 네트워크 상태 확인
  try {
    const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/', {
      method: 'HEAD',
    });
    diagnostics.network = response.ok ? 'online' : 'error';
    console.log('3️⃣ Network status:', diagnostics.network);
  } catch (err) {
    diagnostics.network = 'offline';
    console.error('❌ Network error:', err);
  }

  // 4. localStorage 확인
  try {
    const storageKeys = Object.keys(localStorage);
    diagnostics.localStorage = storageKeys.filter(
      key => key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')
    );
    console.log('4️⃣ Auth-related localStorage keys:', diagnostics.localStorage);
  } catch (err) {
    console.error('❌ Failed to check localStorage:', err);
  }

  return diagnostics;
};

/**
 * 로그아웃 디버그 모드
 */
export const debugSignOut = async () => {
  console.log('🐛 DEBUG: Starting sign out process...');

  // 진단 실행
  await diagnoseSupabaseConnection();

  console.log('🐛 DEBUG: Calling supabase.auth.signOut()...');
  const startTime = Date.now();

  try {
    // 타임아웃 3초
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DEBUG: Timeout after 3s')), 3000)
    );

    const signOutPromise = supabase.auth.signOut();

    const result = await Promise.race([signOutPromise, timeoutPromise]);

    const duration = Date.now() - startTime;
    console.log(`✅ DEBUG: Sign out completed in ${duration}ms`);
    console.log('🐛 DEBUG: Result:', result);

    return { success: true, duration, result };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ DEBUG: Sign out failed after ${duration}ms`);
    console.error('🐛 DEBUG: Error:', error);

    return { success: false, duration, error };
  }
};

/**
 * 로컬 세션 강제 클리어 (디버그용)
 */
export const forceLocalSignOut = () => {
  console.log('🔨 FORCE: Clearing all auth-related data...');

  try {
    let totalRemoved = 0;

    // 1. localStorage 클리어
    const storageKeys = Object.keys(localStorage);
    storageKeys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        localStorage.removeItem(key);
        console.log(`🗑️ [localStorage] ${key}`);
        totalRemoved++;
      }
    });

    // 2. sessionStorage 클리어
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
        sessionStorage.removeItem(key);
        console.log(`🗑️ [sessionStorage] ${key}`);
        totalRemoved++;
      }
    });

    // 3. 쿠키 삭제
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
          document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${trimmedName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
          console.log(`🗑️ [cookie] ${trimmedName}`);
          totalRemoved++;
        }
      });
    }

    console.log(
      `✅ FORCE: Removed ${totalRemoved} items (localStorage + sessionStorage + cookies)`
    );

    return { success: true, totalRemoved };
  } catch (error) {
    console.error('❌ FORCE: Failed to clear local data:', error);
    return { success: false, error };
  }
};
