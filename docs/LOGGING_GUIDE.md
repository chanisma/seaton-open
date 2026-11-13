# 로깅 가이드

## 개요

Seaton 프로젝트는 환경 기반 로깅 시스템을 사용하여 개발과 프로덕션 환경에서 적절한 로그 레벨을 유지합니다.

## 로깅 시스템

### logger 유틸리티

`src/utils/logger.ts`에 정의된 logger는 다음과 같은 메서드를 제공합니다:

```typescript
import { logger } from '@utils/logger';

// 디버그 로그 (개발 + DEBUG 모드에서만)
logger.debug('상세 디버그 정보', { data });

// 정보 로그 (개발 환경에서만)
logger.info('일반 정보');

// 경고 로그 (모든 환경)
logger.warn('경고 메시지');

// 에러 로그 (모든 환경)
logger.error('에러 발생', error);

// 성공 로그 (개발 환경에서만)
logger.success('작업 완료');
```

### 환경 변수 설정

`.env` 파일에 다음 변수를 설정할 수 있습니다:

```env
# 디버그 모드 활성화 (개발 환경 전용)
VITE_DEBUG=true  # 또는 false
```

## 로그 레벨별 동작

| 메서드 | 개발 환경 | 프로덕션 환경 | DEBUG=true | 용도 |
|--------|----------|-------------|-----------|------|
| `debug()` | ❌ | ❌ | ✅ | 상세한 디버깅 정보 |
| `info()` | ✅ | ❌ | ✅ | 일반적인 정보 로그 |
| `warn()` | ✅ | ✅ | ✅ | 경고 메시지 |
| `error()` | ✅ | ✅ | ✅ | 에러 로그 |
| `success()` | ✅ | ❌ | ✅ | 성공 메시지 |

## 프로덕션 환경 최적화

### 자동 로그 제거

프로덕션 빌드 시:
- `logger.debug()`, `logger.info()`, `logger.success()` 호출은 실행되지 않음
- `logger.error()`, `logger.warn()`만 실행됨
- 번들 크기 최적화

### 모범 사례

1. **에러 로그**: 항상 `logger.error()` 사용
   ```typescript
   try {
     // ...
   } catch (err) {
     logger.error('작업 실패:', err);
     throw err;
   }
   ```

2. **디버그 로그**: 상세 정보는 `logger.debug()` 사용
   ```typescript
   logger.debug('API 호출 시작:', { url, params });
   ```

3. **정보 로그**: 일반 정보는 `logger.info()` 사용
   ```typescript
   logger.info('사용자 로그인 성공');
   ```

4. **경고 로그**: 잠재적 문제는 `logger.warn()` 사용
   ```typescript
   if (!data) {
     logger.warn('데이터가 비어있습니다');
   }
   ```

## 기존 console.log 마이그레이션

### Before
```typescript
console.log('🔍 데이터 조회 중...');
console.error('에러 발생:', error);
```

### After
```typescript
logger.info('데이터 조회 중...');
logger.error('에러 발생:', error);
```

## 디버그 모드 활성화

개발 중 상세한 로그가 필요한 경우:

1. `.env.local` 파일 생성
2. `VITE_DEBUG=true` 추가
3. 개발 서버 재시작

```bash
npm run dev
```

## 현재 적용 상태

### ✅ Logger 적용 완료
- `src/utils/logger.ts` - 로깅 유틸리티
- `.env.example` - DEBUG 플래그 추가

### 🔄 향후 적용 예정
- `auth.service.ts` - 인증 관련 로그
- `reservation.service.ts` - 예약 관련 로그
- `statistics.service.ts` - 통계 관련 로그
- `useAuth.ts` - 인증 훅 로그
- `AuthProvider.tsx` - 인증 프로바이더 로그

## 참고사항

- **개발 환경**: `npm run dev` 실행 시 `import.meta.env.DEV === true`
- **프로덕션 환경**: `npm run build` 빌드 결과물
- **DEBUG 모드**: `.env`에서 `VITE_DEBUG=true` 설정 시 활성화
