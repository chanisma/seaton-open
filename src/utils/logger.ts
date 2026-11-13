/**
 * 환경 기반 로깅 유틸리티
 * 개발 환경에서만 로그를 출력하고, 프로덕션에서는 에러만 출력
 */

const isDevelopment = import.meta.env.DEV;
const isDebugMode = import.meta.env.VITE_DEBUG === 'true';

export const logger = {
  /**
   * 디버그 로그 (개발 환경 + DEBUG 모드에서만)
   */
  debug: (...args: any[]) => {
    if (isDevelopment && isDebugMode) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * 정보 로그 (개발 환경에서만)
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * 경고 로그 (모든 환경)
   */
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * 에러 로그 (모든 환경)
   */
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },

  /**
   * 성공 로그 (개발 환경에서만)
   */
  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[SUCCESS]', ...args);
    }
  },
};
