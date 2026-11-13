# 데이터베이스 마이그레이션 가이드

> **날짜**: 2025-01-04
> **목적**: seat_reservations 테이블이 profiles.id를 사용하도록 변경

## 📋 변경 사항 요약

### 이전 구조
- `seat_reservations.student_id` → `resource.id` 참조
- `seat_reservations.checked_by` → `resource.id` 참조 (교사)
- resource 테이블과 조인하여 학생 정보 조회

### 새로운 구조
- `seat_reservations.student_id` → `profiles.id` 참조
- `seat_reservations.checked_by` → `profiles.id` 참조 (교사)
- profiles 테이블에 학생 정보 필드 추가 (name, grade, class, student_number)
- profiles 테이블과 조인하여 학생 정보 조회

## 🎯 마이그레이션 이유

1. **단순화**: resource 테이블 없이 profiles 테이블만으로 모든 정보 관리
2. **일관성**: auth.uid()가 profiles.id와 동일하여 RLS 정책 단순화
3. **성능**: 추가 조인 없이 직접 조회 가능

## 🚀 마이그레이션 실행 방법

### 1단계: profiles 테이블에 학생 정보 필드 추가

**파일**: `supabase/migrations/20250104_update_profiles_add_student_info.sql`

Supabase Dashboard → SQL Editor에서 실행:

```sql
-- profiles 테이블에 학생 정보 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grade INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS class INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_number TEXT;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_profiles_grade ON profiles(grade) WHERE role = 'student';
CREATE INDEX IF NOT EXISTS idx_profiles_student_number ON profiles(student_number) WHERE role = 'student';
```

### 2단계: seat_reservations 테이블 재생성

**파일**: `supabase/migrations/20250104_update_seat_reservations_use_profiles.sql`

⚠️ **주의**: 기존 seat_reservations 데이터가 모두 삭제됩니다!

Supabase Dashboard → SQL Editor에서 실행:

```sql
-- 1. 기존 테이블 삭제 (RLS 정책 포함)
DROP TABLE IF EXISTS seat_reservations CASCADE;

-- 2. seat_reservations 테이블 재생성
CREATE TABLE seat_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  is_attended BOOLEAN DEFAULT FALSE,
  attended_at TIMESTAMPTZ,
  checked_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_student_reservation UNIQUE(student_id, reservation_date),
  CONSTRAINT unique_seat_reservation UNIQUE(room_id, seat_number, reservation_date)
);

-- 3. 인덱스 생성
CREATE INDEX idx_reservations_student ON seat_reservations(student_id);
CREATE INDEX idx_reservations_room_date ON seat_reservations(room_id, reservation_date);
CREATE INDEX idx_reservations_date ON seat_reservations(reservation_date);

-- 4. RLS 활성화
ALTER TABLE seat_reservations ENABLE ROW LEVEL SECURITY;

-- 5. RLS 정책 생성
CREATE POLICY "Students can view own reservations"
  ON seat_reservations FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create own reservations"
  ON seat_reservations FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can delete own reservations"
  ON seat_reservations FOR DELETE
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view all reservations"
  ON seat_reservations FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));

CREATE POLICY "Teachers can update attendance"
  ON seat_reservations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));
```

## 📝 코드 변경 사항

### 1. 타입 정의 업데이트

**파일**: `src/types/user.types.ts`

```typescript
export interface Profile {
  id: string;
  email: string;
  role: UserType;
  last_login: string;
  created_at: string;
  updated_at: string;
  // 학생 정보 추가
  name?: string;
  grade?: number;
  class?: number;
  student_number?: string;
}
```

**파일**: `src/types/reservation.types.ts`

```typescript
export interface SeatReservation {
  id: string;
  student_id: string; // profiles.id 참조
  room_id: string;
  seat_number: string;
  reservation_date: string;
  is_attended: boolean;
  attended_at?: string;
  checked_by?: string; // 교사 profiles.id
  created_at: string;
  // Supabase join 결과
  profiles?: Profile; // student_id로 조인된 profiles
  checker?: Profile; // checked_by로 조인된 profiles
  study_rooms?: StudyRoom; // room_id로 조인된 study_rooms
}
```

### 2. 서비스 레이어 업데이트

**파일**: `src/services/reservation.service.ts`

```typescript
// 교사용 예약 조회 시 profiles 조인
export const getAllReservationsByDate = async (date: Date): Promise<SeatReservation[]> => {
  const dateStr = formatDate(date);

  const { data, error } = await supabase
    .from('seat_reservations')
    .select('*, profiles!inner(id, email, name, grade, class, student_number)')
    .eq('reservation_date', dateStr)
    .order('room_id')
    .order('seat_number');

  if (error) throw new Error('예약 정보를 불러오는데 실패했습니다.');
  return data || [];
};
```

### 3. 컴포넌트 업데이트

**파일**: `src/components/teacher/AttendanceSeat.tsx`

```typescript
// reservation.resource → reservation.profiles 변경
<h4 className="font-semibold">
  {reservation.profiles?.name || '학생 정보 없음'}
</h4>

{reservation.profiles && (
  <div>
    <p>{reservation.profiles.grade}학년 {reservation.profiles.class}반</p>
    <p>학번: {reservation.profiles.student_number}</p>
  </div>
)}
```

## ✅ 검증 체크리스트

마이그레이션 완료 후 다음 사항을 확인하세요:

- [ ] profiles 테이블에 name, grade, class, student_number 컬럼 존재
- [ ] seat_reservations 테이블의 student_id가 profiles.id 참조
- [ ] seat_reservations 테이블의 checked_by가 profiles.id 참조
- [ ] RLS 정책이 올바르게 설정됨 (5개 정책)
- [ ] 학생이 로그인하면 profiles에 학생 정보 자동 저장
- [ ] 자리 신청 기능 정상 작동
- [ ] 교사가 출석 체크 시 학생 정보 정상 표시
- [ ] 통계 대시보드 정상 작동

## 🔧 트러블슈팅

### 문제: RLS 정책 위반 에러

**증상**: `new row violates row-level security policy`

**해결**:
1. Supabase Dashboard → Authentication → Policies 확인
2. seat_reservations 테이블의 RLS 정책 5개가 모두 활성화되어 있는지 확인
3. 필요시 마이그레이션 파일 재실행

### 문제: 학생 정보 표시 안 됨

**증상**: 출석 체크 페이지에서 학생 이름/학년/반 표시 안 됨

**해결**:
1. profiles 테이블에 학생 정보가 저장되어 있는지 확인:
   ```sql
   SELECT id, email, name, grade, class, student_number FROM profiles WHERE role = 'student';
   ```
2. 없다면 다시 로그인하여 auth.service.ts가 자동으로 정보 저장하도록 함
3. 또는 수동으로 업데이트:
   ```sql
   UPDATE profiles p
   SET
     name = r.name,
     grade = (r.meta->>'grade')::INTEGER,
     class = (r.meta->>'class')::INTEGER,
     student_number = COALESCE(r.meta->>'id', r.meta->>'studentId')
   FROM resource r
   WHERE
     p.role = 'student'
     AND p.name IS NULL
     AND (r.meta->>'id' = SPLIT_PART(p.email, '@', 1)
          OR r.meta->>'studentId' = SPLIT_PART(p.email, '@', 1));
   ```

### 문제: 자리 신청 실패

**증상**: `자리 신청에 실패했습니다` 에러

**해결**:
1. 브라우저 콘솔에서 에러 메시지 확인
2. student_id가 profiles.id와 일치하는지 확인:
   ```sql
   SELECT auth.uid() AS current_user_id;
   SELECT id, email FROM profiles WHERE id = auth.uid();
   ```
3. RLS 정책이 올바른지 확인

## 📚 추가 리소스

- [Supabase RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Foreign Keys](https://supabase.com/docs/guides/database/foreign-key-constraints)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)

## 🔄 롤백 방법

마이그레이션을 되돌려야 하는 경우:

```sql
-- 1. seat_reservations 삭제
DROP TABLE IF EXISTS seat_reservations CASCADE;

-- 2. profiles 컬럼 제거
ALTER TABLE profiles DROP COLUMN IF EXISTS name;
ALTER TABLE profiles DROP COLUMN IF EXISTS grade;
ALTER TABLE profiles DROP COLUMN IF EXISTS class;
ALTER TABLE profiles DROP COLUMN IF EXISTS student_number;

-- 3. 이전 seat_reservations 구조 재생성 (resource.id 참조)
-- (기존 마이그레이션 파일 참조)
```

⚠️ **주의**: 롤백 시 모든 예약 데이터가 삭제됩니다!
