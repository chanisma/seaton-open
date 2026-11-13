# 출석 체크 문제 디버깅 가이드

## 🔍 문제 상황
출석 체크 버튼을 눌러도 `is_attended` 값이 업데이트되지 않습니다.

## 📋 점검 사항

### 1. RLS 정책 확인

**Supabase SQL Editor에서 다음 쿼리 실행:**

```sql
-- 1. seat_reservations 테이블의 모든 RLS 정책 확인
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

**예상 결과:**
- `Teachers can update attendance` 정책이 존재해야 함
- `cmd` = `UPDATE`
- `qual`과 `with_check`에 teacher 역할 확인 로직 포함

### 2. 현재 사용자 정보 확인

**Supabase SQL Editor에서 실행:**

```sql
-- 2. 현재 로그인한 사용자의 auth.uid()와 profiles 정보 확인
SELECT
  auth.uid() as auth_uid,
  p.id as profile_id,
  p.email,
  p.role,
  p.name
FROM profiles p
WHERE p.id = auth.uid();
```

**예상 결과:**
- `auth_uid`와 `profile_id`가 동일해야 함
- `role`이 `teacher`여야 함 (교사 계정으로 로그인 시)

### 3. UPDATE 권한 테스트

**Supabase SQL Editor에서 실행 (교사 계정으로 로그인 후):**

```sql
-- 3. 실제 UPDATE 테스트 (안전하게 되돌릴 수 있도록)
BEGIN;

-- 예약 하나 선택
SELECT id, student_id, is_attended, reservation_date
FROM seat_reservations
LIMIT 1;

-- 위에서 나온 ID로 UPDATE 시도 (YOUR_RESERVATION_ID를 실제 ID로 교체)
UPDATE seat_reservations
SET is_attended = true,
    attended_at = NOW(),
    checked_by = auth.uid()
WHERE id = 'YOUR_RESERVATION_ID';

-- 결과 확인
SELECT id, is_attended, attended_at, checked_by
FROM seat_reservations
WHERE id = 'YOUR_RESERVATION_ID';

-- 변경사항 되돌리기
ROLLBACK;
```

**결과 분석:**
- UPDATE가 성공하면 → RLS 정책 정상, 프론트엔드 문제
- UPDATE가 실패하면 → RLS 정책 문제

### 4. 마이그레이션 실행 확인

**다음 명령으로 마이그레이션 상태 확인:**

```sql
-- Supabase 마이그레이션 히스토리 확인
SELECT * FROM supabase_migrations.schema_migrations
ORDER BY version DESC;
```

**확인 사항:**
- `20250104_update_seat_reservations_use_profiles.sql` 마이그레이션이 실행되었는지 확인

**마이그레이션이 없는 경우:**

```bash
# 로컬에서 Supabase CLI 사용
npx supabase db push

# 또는 Supabase Dashboard에서 SQL Editor로 직접 실행
```

## 🔧 해결 방법

### 방법 1: RLS 정책이 없는 경우

**Supabase SQL Editor에서 실행:**

```sql
-- seat_reservations 테이블에 RLS 활성화
ALTER TABLE seat_reservations ENABLE ROW LEVEL SECURITY;

-- 교사 UPDATE 정책 생성
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

### 방법 2: RLS 정책이 있지만 작동하지 않는 경우

**정책 재생성:**

```sql
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Teachers can update attendance" ON seat_reservations;

-- 새로운 정책 생성
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

### 방법 3: RLS 정책 임시 비활성화 (디버깅용)

**⚠️ 프로덕션에서는 절대 사용 금지!**

```sql
-- RLS 비활성화 (테스트용)
ALTER TABLE seat_reservations DISABLE ROW LEVEL SECURITY;

-- 테스트 후 다시 활성화
ALTER TABLE seat_reservations ENABLE ROW LEVEL SECURITY;
```

## 📊 콘솔 로그 확인

**브라우저 개발자 도구 콘솔에서 다음 정보 확인:**

1. **출석 체크 호출 로그:**
```
🎯 checkAttendance called: { reservationId: '...', teacherProfileId: '...' }
```

2. **UPDATE 데이터:**
```
📝 UPDATE data: { is_attended: true, attended_at: '...', checked_by: '...' }
```

3. **UPDATE 결과:**
```
📊 UPDATE result: { error: null, status: 200, statusText: 'OK', ... }
```

**문제 패턴:**

| 로그 | 의미 | 해결 방법 |
|------|------|----------|
| `status: 200, error: null` | UPDATE 성공 | 프론트엔드 새로고침 문제 |
| `status: 401/403` | 권한 없음 | RLS 정책 확인 |
| `status: 406` | 요청 형식 오류 | 쿼리 수정 필요 |
| `error: { code: 'PGRST...'}` | PostgREST 오류 | 에러 메시지 확인 |

## 🎯 체크리스트

- [ ] RLS 정책이 seat_reservations 테이블에 존재하는가?
- [ ] 교사 계정으로 로그인했는가?
- [ ] auth.uid()와 profile_id가 일치하는가?
- [ ] profiles 테이블에 role='teacher'로 설정되어 있는가?
- [ ] 마이그레이션이 실행되었는가?
- [ ] 콘솔에 에러가 표시되는가?
- [ ] UPDATE 쿼리가 실제로 실행되는가?

## 📞 추가 지원

문제가 계속되면 다음 정보를 수집하여 제공:

1. **RLS 정책 목록** (첫 번째 SQL 쿼리 결과)
2. **현재 사용자 정보** (두 번째 SQL 쿼리 결과)
3. **콘솔 로그 전체 내용**
4. **Supabase 대시보드의 Table Editor에서 seat_reservations 테이블 구조**
