# 로그아웃 디버깅 가이드

> **문제**: `supabase.auth.signOut()`에서 응답이 없고 멈춤

## 🔧 적용된 수정 사항

### 1. 모든 클라이언트 저장소 우선 클리어 (동기적)
```typescript
// services/auth.service.ts
export const signOut = async () => {
  // 1단계: localStorage, sessionStorage, 쿠키 모두 즉시 클리어

  // 1-1. localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
      localStorage.removeItem(key);
    }
  });

  // 1-2. sessionStorage
  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')) {
      sessionStorage.removeItem(key);
    }
  });

  // 1-3. 쿠키 삭제
  document.cookie.split(';').forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    if (name.startsWith('sb-') || name.includes('supabase') || name.includes('auth')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
}
```

### 2. Supabase 서버 세션 종료 (백그라운드, 3초 타임아웃)
로컬 세션 클리어 후 서버 세션 종료 시도:
```typescript
// 3초 타임아웃으로 Supabase signOut 시도
// 실패해도 로컬은 이미 클리어되어 있음
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout after 3s')), 3000)
);

await Promise.race([supabase.auth.signOut(), timeoutPromise]);
```

### 3. 디버깅 유틸리티 추가
`src/utils/debugAuth.ts` 파일 생성

---

## 🐛 디버깅 방법

### 방법 1: 브라우저 콘솔에서 진단

1. **F12** 또는 **우클릭 → 검사**로 개발자 도구 열기
2. **Console** 탭으로 이동
3. 다음 코드 입력:

```javascript
// Supabase 연결 진단
import { diagnoseSupabaseConnection } from './src/utils/debugAuth';
await diagnoseSupabaseConnection();

// 디버그 로그아웃 시도
import { debugSignOut } from './src/utils/debugAuth';
await debugSignOut();

// 강제 로컬 세션 클리어
import { forceLocalSignOut } from './src/utils/debugAuth';
forceLocalSignOut();
```

### 방법 2: 임시 버튼 추가

#### 2-1. Navigation.tsx에 디버그 버튼 추가

`src/components/common/Navigation.tsx`에 임시 디버그 버튼 추가:

```tsx
import { diagnoseSupabaseConnection, debugSignOut, forceLocalSignOut } from '@utils/debugAuth';

// Navigation 컴포넌트 안에 추가
<button
  onClick={async () => {
    console.log('=== DIAGNOSTICS ===');
    await diagnoseSupabaseConnection();
  }}
  className="px-3 py-1 bg-yellow-500 text-white rounded"
>
  진단
</button>

<button
  onClick={async () => {
    console.log('=== DEBUG SIGN OUT ===');
    await debugSignOut();
  }}
  className="px-3 py-1 bg-orange-500 text-white rounded"
>
  디버그 로그아웃
</button>

<button
  onClick={() => {
    console.log('=== FORCE SIGN OUT ===');
    forceLocalSignOut();
    window.location.href = '/login';
  }}
  className="px-3 py-1 bg-red-500 text-white rounded"
>
  강제 로그아웃
</button>
```

---

## 📊 예상되는 문제 원인

### 1. 네트워크 문제
**증상**: Supabase 서버에 연결할 수 없음

**확인 방법**:
```javascript
// 콘솔에서 실행
fetch('https://your-project.supabase.co/rest/v1/', { method: 'HEAD' })
  .then(res => console.log('Network:', res.ok ? 'OK' : 'Error'))
  .catch(err => console.error('Network error:', err));
```

**해결**:
- Supabase 프로젝트가 활성화되어 있는지 확인
- `.env` 파일의 `VITE_SUPABASE_URL` 확인
- 네트워크 연결 확인

### 2. CORS 문제
**증상**: 브라우저 콘솔에 CORS 에러 표시

**해결**:
- Supabase Dashboard → Settings → API → CORS 설정 확인
- 개발 환경: `http://localhost:5173` 추가
- 프로덕션: 실제 도메인 추가

### 3. 잘못된 세션 상태
**증상**: localStorage에 깨진 세션 토큰 존재

**확인 방법**:
```javascript
// 콘솔에서 실행
Object.keys(localStorage)
  .filter(key => key.startsWith('sb-'))
  .forEach(key => {
    console.log(key, localStorage.getItem(key));
  });
```

**해결**:
```javascript
// 강제 클리어
import { forceLocalSignOut } from './src/utils/debugAuth';
forceLocalSignOut();
```

### 4. Supabase SDK 버전 문제
**증상**: 특정 버전에서 signOut이 hang됨

**확인**:
```bash
npm list @supabase/supabase-js
```

**해결**:
```bash
# 최신 버전으로 업데이트
npm install @supabase/supabase-js@latest
```

---

## 🔍 디버깅 로그 해석

### 정상 로그아웃
```
🚪 Signing out...
🔓 Starting sign out process...
🗑️ Clearing all client storage...
  ✓ [localStorage] sb-xyz-auth-token
  ✓ [sessionStorage] sb-xyz-session
  ✓ [cookie] sb-auth-token
✅ Cleared 5 storage items (localStorage + sessionStorage + cookies)
🔓 Calling Supabase signOut (3s timeout)...
✅ Supabase signOut successful
✅ Sign out complete
👤 User logged out
🔄 Redirecting to login...
```

### 타임아웃 발생 (모든 저장소는 이미 클리어됨)
```
🚪 Signing out...
🔓 Starting sign out process...
🗑️ Clearing all client storage...
  ✓ [localStorage] sb-xyz-auth-token
  ✓ [sessionStorage] sb-xyz-session
  ✓ [cookie] sb-auth-token
✅ Cleared 5 storage items (localStorage + sessionStorage + cookies)
🔓 Calling Supabase signOut (3s timeout)...
⚠️ Supabase signOut failed or timed out: Error: Timeout after 3s
💡 Local session already cleared, continuing...
✅ Sign out complete
👤 User logged out
🔄 Redirecting to login...
```

### 네트워크 에러 (모든 저장소는 이미 클리어됨)
```
🚪 Signing out...
🔓 Starting sign out process...
🗑️ Clearing all client storage...
  ✓ [localStorage] sb-xyz-auth-token
  ✓ [sessionStorage] sb-xyz-session
  ✓ [cookie] sb-auth-token
✅ Cleared 5 storage items (localStorage + sessionStorage + cookies)
🔓 Calling Supabase signOut (3s timeout)...
⚠️ Supabase signOut failed or timed out: TypeError: Failed to fetch
💡 Local session already cleared, continuing...
✅ Sign out complete
```

---

## ✅ 문제 해결 체크리스트

- [ ] Supabase 프로젝트가 활성화되어 있는지 확인
- [ ] `.env` 파일에 올바른 URL과 ANON_KEY 설정
- [ ] 네트워크 연결 확인
- [ ] 브라우저 콘솔에서 에러 메시지 확인
- [ ] `diagnoseSupabaseConnection()` 실행
- [ ] localStorage에 `sb-` 키가 있는지 확인
- [ ] 필요시 `forceLocalSignOut()` 실행
- [ ] Supabase SDK 버전 확인

---

## 🆘 긴급 로그아웃 방법

만약 정상적인 로그아웃이 불가능한 경우:

### 방법 1: 개발자 도구에서 직접 실행
```javascript
// localStorage 클리어
Object.keys(localStorage)
  .filter(key => key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))
  .forEach(key => localStorage.removeItem(key));

// 페이지 리로드
window.location.href = '/login';
```

### 방법 2: Application 탭에서 수동 삭제
1. **F12** → **Application** 탭
2. **Local Storage** → 프로젝트 도메인 선택
3. `sb-`로 시작하는 모든 항목 삭제
4. 페이지 새로고침

### 방법 3: 시크릿 모드 사용
1. 시크릿/프라이빗 브라우징 모드로 앱 열기
2. 로그인 시도
3. 정상 작동하면 원래 창에서 모든 쿠키/localStorage 삭제

---

## 📞 추가 지원

이 가이드로도 해결되지 않는 경우:

1. 브라우저 콘솔의 **전체 로그** 캡처
2. `diagnoseSupabaseConnection()` 결과 복사
3. `.env` 파일 내용 확인 (ANON_KEY는 제외)
4. Supabase Dashboard → Logs 확인

---

## 🔄 수정 사항 요약

| 항목 | 이전 | 이후 |
|------|------|------|
| 로그아웃 순서 | Supabase 먼저 | **모든 저장소 먼저** (동기적) |
| 클리어 범위 | localStorage만 | **localStorage + sessionStorage + 쿠키** |
| 자동 재로그인 | 가능 (sessionStorage 남음) | **완전히 차단** |
| 타임아웃 | 없음 (무한 대기) | 3초 타임아웃 |
| 에러 처리 | Supabase 의존 | 전체 클리어 후 Supabase 시도 |
| 사용자 경험 | 대기 시간 김 | **즉시 로그아웃** |
| 디버깅 도구 | 없음 | debugAuth.ts 유틸리티 |
| 로그아웃 흐름 | 중복 처리 | onAuthStateChange 단일 처리 |
