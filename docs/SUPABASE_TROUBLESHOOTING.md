# Supabase 연결 문제 해결 가이드

> **작성일**: 2025-01-03
> **문제**: 자리 신청 시 쿼리 타임아웃 발생 (10초 후 실패)

## 🔍 문제 분석 결과

### 확인된 사항 ✅
1. **데이터베이스 상태**: 정상
   - 테이블 생성 완료
   - 인덱스 모두 생성됨 (12개)
   - RLS 비활성화 상태
   - 직접 SQL 쿼리는 **즉시 완료**

2. **쿼리 성능**: 문제 없음
   ```sql
   SELECT * FROM seat_reservations
   WHERE student_id = ? AND reservation_date = ?
   LIMIT 1;
   ```
   → 직접 실행 시 즉시 완료

3. **코드 로직**: 정상
   - 쿼리 구조 정확
   - 타임아웃 처리 구현됨
   - 에러 핸들링 적절

### 문제의 핵심 ⚠️

**Supabase JS 클라이언트가 서버에 연결하지 못하고 있습니다.**

**원인**: 환경 변수 미설정 또는 잘못된 설정
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 🛠️ 해결 방법

### Step 1: 환경 변수 파일 확인

프로젝트 루트에 `.env` 파일이 있는지 확인:

```bash
# Windows
dir .env

# 없다면 생성
copy .env.example .env
```

### Step 2: Supabase 대시보드에서 정보 가져오기

1. **Supabase 대시보드 접속**: https://supabase.com/dashboard
2. **프로젝트 선택**
3. **Settings** → **API** 메뉴로 이동
4. 다음 정보 복사:
   - **Project URL** (`https://[your-project-ref].supabase.co`)
   - **anon public key** (긴 JWT 토큰 형태)

### Step 3: `.env` 파일 설정

`.env` 파일을 다음과 같이 작성:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**⚠️ 주의사항**:
- `.env` 파일은 **프로젝트 루트**에 위치해야 합니다
- 실제 값으로 `your-project-ref`와 `your-anon-key-here`를 교체하세요
- **절대로** `.env` 파일을 Git에 커밋하지 마세요 (이미 `.gitignore`에 포함됨)

### Step 4: 개발 서버 재시작

환경 변수 변경 후 반드시 재시작:

```bash
# 기존 서버 중단 (Ctrl+C)
# 재시작
npm run dev
```

### Step 5: 연결 테스트

브라우저 개발자 도구 콘솔에서 다음 로그 확인:

```
🔧 Supabase Configuration:
  url: https://xxxxx.supabase.co...
  anonKey: eyJhbGciOiJIUzI1NiIs...
✅ Supabase client initialized
```

**만약 다음과 같이 나온다면 문제:**
```
url: MISSING
anonKey: MISSING
```
→ `.env` 파일이 없거나 잘못 설정됨

---

## 🧪 진단 도구 사용하기

코드에 추가된 `testSupabaseConnection()` 함수를 사용하여 연결 상태를 진단할 수 있습니다.

### 콘솔에서 테스트하기

브라우저 콘솔에서 다음을 실행:

```javascript
// 1. 서비스 import (개발 도구에서만)
import { testSupabaseConnection } from './src/services/reservation.service';

// 2. 테스트 실행
const result = await testSupabaseConnection();
console.log('Test Result:', result);
```

### 예상 결과

**성공 시**:
```javascript
{
  success: true,
  details: {
    configCheck: true,
    simpleQuery: true,
    targetQuery: true
  }
}
```

**실패 시**:
```javascript
{
  success: false,
  details: {
    configCheck: false,
    simpleQuery: false,
    targetQuery: false,
    error: "Missing environment variables"
  }
}
```

---

## 🔧 일반적인 문제 및 해결

### 1. "Missing environment variables" 에러

**원인**: `.env` 파일이 없거나 변수명이 틀림

**해결**:
- `.env` 파일 위치 확인 (프로젝트 루트)
- 변수명 확인: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- 개발 서버 재시작

### 2. "Query timeout" 에러

**원인**: Supabase 서버에 연결되지 않음

**해결**:
- 환경 변수 값 확인 (URL, API Key)
- 네트워크 연결 확인
- Supabase 프로젝트가 활성 상태인지 확인
- 브라우저 네트워크 탭에서 실제 요청 확인

### 3. "Invalid API key" 에러

**원인**: 잘못된 API Key 사용

**해결**:
- Supabase Dashboard에서 **anon key** 재확인
- `service_role` key가 아닌 **anon** key를 사용해야 함
- 복사 시 앞뒤 공백 제거

### 4. CORS 에러

**원인**: Supabase 프로젝트 설정에서 도메인이 허용되지 않음

**해결**:
1. Supabase Dashboard → Settings → API
2. **Site URL** 확인 및 추가:
   - `http://localhost:5173` (개발 환경)
   - 프로덕션 도메인 (배포 시)

---

## 📋 체크리스트

연결이 안 될 때 다음 항목을 순서대로 확인하세요:

- [ ] `.env` 파일이 프로젝트 루트에 존재
- [ ] `VITE_SUPABASE_URL` 값이 올바름 (`https://[project-ref].supabase.co`)
- [ ] `VITE_SUPABASE_ANON_KEY` 값이 올바름 (JWT 토큰 형태)
- [ ] 개발 서버를 재시작함
- [ ] 브라우저 콘솔에 "✅ Supabase client initialized" 로그 확인
- [ ] Supabase 프로젝트가 활성 상태
- [ ] 네트워크 연결 정상
- [ ] 브라우저 개발자 도구 → Network 탭에서 Supabase 요청 확인

---

## 🆘 추가 도움이 필요한 경우

위 모든 방법을 시도해도 문제가 해결되지 않는다면:

1. **브라우저 콘솔 로그 전체 복사**
2. **브라우저 네트워크 탭 스크린샷**
3. **`.env` 파일 내용** (민감한 정보는 마스킹)
4. **Supabase Dashboard → Settings → API 스크린샷**

위 정보를 제공하면 더 정확한 진단이 가능합니다.

---

## 📚 참고 자료

- [Supabase 공식 문서 - 환경 변수 설정](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs)
- [Vite 환경 변수 가이드](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase JavaScript 클라이언트 문서](https://supabase.com/docs/reference/javascript/introduction)
