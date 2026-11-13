# 출석 체크 RLS 정책 디버깅 완전 가이드

## 🎯 문제 상황

출석 체크 버튼을 클릭해도 `is_attended` 값이 업데이트되지 않는 문제.

**증상**:
- 에러 메시지 없음
- 406 에러 해결됨
- UPDATE 쿼리가 실행되는 것처럼 보이지만 데이터베이스에 반영 안 됨

**가능성 높은 원인**: RLS (Row Level Security) 정책 문제

---

## 📋 단계별 진단 프로세스

### 1단계: 현재 로그인 사용자 확인

**목적**: auth.uid()와 profiles.id가 일치하는지 확인

**Supabase SQL Editor에서 실행**:
```sql
-- 현재 사용자 정보 확인
SELECT
  auth.uid() as auth_uid,
  p.id as profile_id,
  p.email,
  p.role,
  p.name
FROM profiles p
WHERE p.id = auth.uid();
```

**예상 결과**:
```
auth_uid          | profile_id        | email                    | role    | name
------------------|-------------------|--------------------------|---------|-------
abc123...         | abc123...         | teacher@myschool.hs.kr      | teacher | 홍길동
```

**✅ 체크 포인트**:
- [ ] `auth_uid`와 `profile_id`가 동일한가?
- [ ] `role`이 `teacher`인가?
- [ ] 레코드가 반환되는가? (없으면 profiles 테이블에 데이터가 없음)

**❌ 문제 발견 시 해결 방법**:
- **레코드 없음**: 로그인 시 profiles 생성 로직 확인
- **role이 teacher가 아님**: profiles.role을 'teacher'로 수동 업데이트
  ```sql
  UPDATE profiles SET role = 'teacher' WHERE email = 'your-email@myschool.hs.kr';
  ```

---

### 2단계: RLS 정책 존재 여부 확인

**목적**: seat_reservations 테이블에 UPDATE 정책이 실제로 존재하는지 확인

**Supabase SQL Editor에서 실행**:
```sql
-- seat_reservations 테이블의 모든 RLS 정책 확인
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'seat_reservations';
```

**예상 결과**:
```
policyname                        | cmd    | permissive | roles
----------------------------------|--------|------------|--------
Teachers can update attendance    | UPDATE | PERMISSIVE | {authenticated}
Students can view own reservations| SELECT | PERMISSIVE | {authenticated}
...
```

**✅ 체크 포인트**:
- [ ] "Teachers can update attendance" 정책이 존재하는가?
- [ ] `cmd`가 `UPDATE`인가?
- [ ] `permissive`가 `PERMISSIVE`인가?

**❌ 문제 발견 시 해결 방법**:

**Case A: 정책이 아예 없는 경우**
```sql
-- RLS 활성화
ALTER TABLE seat_reservations ENABLE ROW LEVEL SECURITY;

-- UPDATE 정책 생성
CREATE POLICY "Teachers can update attendance"
  ON seat_reservations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );
```

**Case B: 정책 이름이 다르거나 잘못된 경우**
```sql
-- 기존 정책 삭제
DROP POLICY IF EXISTS "기존정책이름" ON seat_reservations;

-- 올바른 정책 재생성 (위 Case A 쿼리 사용)
```

---

### 3단계: RLS 정책 세부 내용 확인

**목적**: 정책의 USING 및 WITH CHECK 조건이 올바른지 확인

**Supabase SQL Editor에서 실행**:
```sql
-- 정책 상세 내용 확인
SELECT
  policyname,
  cmd,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'seat_reservations'
  AND policyname = 'Teachers can update attendance';
```

**예상 결과**:
```sql
using_clause: (EXISTS ( SELECT 1 FROM profiles WHERE ((id = auth.uid()) AND (role = 'teacher'::text))))
with_check: (EXISTS ( SELECT 1 FROM profiles WHERE ((id = auth.uid()) AND (role = 'teacher'::text))))
```

**✅ 체크 포인트**:
- [ ] `using_clause`에 `auth.uid()`와 `role = 'teacher'` 조건이 있는가?
- [ ] `with_check`에도 동일한 조건이 있는가?

---

### 4단계: UPDATE 권한 실제 테스트

**목적**: SQL Editor에서 직접 UPDATE를 실행하여 RLS 정책이 작동하는지 확인

**⚠️ 주의**: 이 테스트는 실제 데이터를 변경하므로 ROLLBACK으로 되돌립니다.

**Supabase SQL Editor에서 실행** (교사 계정으로 로그인한 상태):
```sql
BEGIN;

-- 1. 테스트할 예약 레코드 조회
SELECT
  id,
  student_id,
  seat_number,
  is_attended,
  reservation_date
FROM seat_reservations
LIMIT 1;

-- 2. 위에서 나온 ID를 복사하여 아래에 붙여넣기
-- YOUR_RESERVATION_ID를 실제 ID로 교체

-- 3. UPDATE 시도
UPDATE seat_reservations
SET
  is_attended = true,
  attended_at = NOW(),
  checked_by = auth.uid()
WHERE id = 'YOUR_RESERVATION_ID';

-- 4. 결과 확인
SELECT
  id,
  is_attended,
  attended_at,
  checked_by
FROM seat_reservations
WHERE id = 'YOUR_RESERVATION_ID';

-- 5. 변경사항 되돌리기 (실제 DB에 반영하지 않음)
ROLLBACK;
```

**✅ 성공 케이스**:
```
UPDATE 1  -- "UPDATE 1"이 표시됨
```
→ **진단**: RLS 정책 정상, 문제는 프론트엔드 코드에 있음

**❌ 실패 케이스**:
```
UPDATE 0  -- "UPDATE 0"이 표시됨 (업데이트된 행이 없음)
```
→ **진단**: RLS 정책이 UPDATE를 차단하고 있음

**실패 시 해결 방법**:
```sql
-- RLS 정책 재생성
DROP POLICY IF EXISTS "Teachers can update attendance" ON seat_reservations;

CREATE POLICY "Teachers can update attendance"
  ON seat_reservations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );
```

---

### 5단계: 마이그레이션 실행 여부 확인

**목적**: 마이그레이션이 실제로 실행되었는지 확인

**Supabase SQL Editor에서 실행**:
```sql
-- Supabase 마이그레이션 히스토리 확인
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

**예상 결과**:
```
version                                   | statements | name
------------------------------------------|------------|------
20250104_update_seat_reservations...      | {...}      | ...
```

**✅ 체크 포인트**:
- [ ] `20250104_update_seat_reservations_use_profiles` 마이그레이션이 있는가?

**❌ 문제 발견 시 해결 방법**:
```bash
# 로컬에서 Supabase CLI 사용
npx supabase db push

# 또는 Supabase Dashboard의 SQL Editor에서
# supabase/migrations/20250104_update_seat_reservations_use_profiles.sql 파일의 내용을 복사하여 직접 실행
```

---

## 🔍 콘솔 로그 분석 가이드

출석 체크 버튼 클릭 시 브라우저 개발자 도구 콘솔에서 확인해야 할 로그:

### 1. 사용자 정보 로그
```
👤 Current user object: {
  profile_id: "abc123-...",
  type: "teacher",
  email: "teacher@myschool.hs.kr"
}
```

**체크 포인트**:
- profile_id가 UUID 형식인가?
- type이 "teacher"인가?

### 2. 출석 체크 호출 로그
```
✅ Attempting to check attendance for: {
  reservationId: "xyz789-...",
  teacherProfileId: "abc123-..."
}

🎯 checkAttendance called: {
  reservationId: "xyz789-...",
  teacherProfileId: "abc123-..."
}
```

**체크 포인트**:
- reservationId가 올바른가?
- teacherProfileId가 사용자 정보의 profile_id와 일치하는가?

### 3. UPDATE 데이터 로그
```
📝 UPDATE data: {
  is_attended: true,
  attended_at: "2025-01-06T...",
  checked_by: "abc123-..."
}
```

**체크 포인트**:
- checked_by가 teacherProfileId와 일치하는가?

### 4. UPDATE 결과 로그
```
📊 UPDATE result: {
  error: null,
  status: 200,
  statusText: "OK",
  data: null,
  count: null
}
```

**문제 패턴 분석**:

| status | error  | 의미 | 해결 방법 |
|--------|--------|------|-----------|
| 200    | null   | UPDATE 성공했지만 데이터 변경 안 됨 | **RLS 정책 문제** → 1-5단계 진단 실행 |
| 401    | {...}  | 인증 오류 | 재로그인 필요 |
| 403    | {...}  | 권한 없음 | RLS 정책 확인 |
| 406    | {...}  | 요청 형식 오류 | 이미 해결됨 (UPDATE/SELECT 분리) |

---

## ✅ 최종 체크리스트

출석 체크가 작동하지 않을 때 순서대로 확인:

- [ ] **1단계**: 현재 사용자의 auth.uid()와 profile_id가 일치하는가?
- [ ] **1단계**: 사용자 role이 'teacher'인가?
- [ ] **2단계**: RLS 정책 "Teachers can update attendance"가 존재하는가?
- [ ] **3단계**: 정책의 USING/WITH CHECK 조건이 올바른가?
- [ ] **4단계**: SQL Editor에서 직접 UPDATE가 성공하는가?
- [ ] **5단계**: 마이그레이션이 실행되었는가?
- [ ] **콘솔**: 브라우저 콘솔에서 모든 로그가 정상인가?

---

## 🛠️ 임시 해결 방법 (프로덕션 금지!)

**⚠️ 절대 프로덕션 환경에서 사용하지 마세요!**

디버깅 목적으로 RLS를 임시로 비활성화하여 UPDATE가 작동하는지 테스트:

```sql
-- RLS 비활성화 (테스트용)
ALTER TABLE seat_reservations DISABLE ROW LEVEL SECURITY;

-- 앱에서 출석 체크 테스트

-- 테스트 후 즉시 다시 활성화
ALTER TABLE seat_reservations ENABLE ROW LEVEL SECURITY;
```

**이 테스트로 확인 가능한 것**:
- ✅ RLS 비활성화 후 작동하면 → RLS 정책 문제
- ❌ RLS 비활성화 후에도 안 되면 → 프론트엔드 코드 문제

---

## 📊 문제 해결 흐름도

```
출석 체크 버튼 클릭
    ↓
콘솔에 로그 표시되는가?
    NO → 프론트엔드 코드 확인
    YES ↓

status: 200, error: null?
    NO → 네트워크/인증 오류 확인
    YES ↓

SQL Editor에서 직접 UPDATE 성공?
    YES → 프론트엔드 코드 문제 (profile_id 전달 확인)
    NO ↓

auth.uid() = profile_id?
    NO → 로그인/profiles 생성 로직 확인
    YES ↓

role = 'teacher'?
    NO → profiles.role 수정
    YES ↓

RLS 정책 존재?
    NO → 정책 생성 (2단계)
    YES ↓

마이그레이션 실행됨?
    NO → 마이그레이션 실행 (5단계)
    YES → Supabase 지원팀 문의
```

---

## 🔗 관련 파일

- **마이그레이션**: `supabase/migrations/20250104_update_seat_reservations_use_profiles.sql`
- **서비스 레이어**: `src/services/reservation.service.ts` (checkAttendance 함수)
- **페이지 컴포넌트**: `src/pages/AttendanceCheckPage.tsx`
- **인증 서비스**: `src/services/auth.service.ts`

---

## 📞 추가 지원이 필요한 경우

위 모든 단계를 실행했는데도 문제가 해결되지 않으면 다음 정보를 수집:

1. **1단계 쿼리 결과** (스크린샷)
2. **2단계 쿼리 결과** (RLS 정책 목록)
3. **4단계 테스트 결과** (UPDATE 0 or UPDATE 1)
4. **브라우저 콘솔 로그 전체** (스크린샷)
5. **Supabase Dashboard → Table Editor → seat_reservations** 테이블 구조 (스크린샷)

---

**Last Updated**: 2025-01-06
**Related Issue**: `is_attended` field not updating despite no errors
