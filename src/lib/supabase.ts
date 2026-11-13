import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');

  const errorMessage = `Missing Supabase environment variables: ${missing.join(', ')}. 
  Please check your .env file locally or your deployment settings (e.g., Vercel, Netlify).`;

  console.error(errorMessage);
  throw new Error(errorMessage);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-client-info': 'seaton-dev',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    // Realtime 기능 완전 비활성화
    params: {
      eventsPerSecond: 0, // 이벤트 차단
    },
  },
});

// 개발 환경에서 디버깅을 위해 window에 노출
// (테스트 등 window가 없는 환경에서도 이 모듈을 import할 수 있어야 합니다)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}
