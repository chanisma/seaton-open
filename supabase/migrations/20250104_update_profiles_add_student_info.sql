-- ================================================================
-- Migration: Add student info fields to profiles table
-- Date: 2025-01-04
-- Description:
--   - profiles 테이블에 학생 정보 필드 추가
--   - 기존 resource 테이블 정보를 profiles로 통합
-- ================================================================

-- 1. profiles 테이블에 학생 정보 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grade INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS class INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_number TEXT;

-- 2. 기존 profiles에서 name이 없는 student 레코드에 대해 resource에서 정보 복사
-- (이미 auth.service.ts에서 처음 로그인 시 자동으로 처리되지만, 기존 데이터 마이그레이션용)
-- UPDATE profiles p
-- SET
--   name = r.name,
--   grade = (r.meta->>'grade')::INTEGER,
--   class = (r.meta->>'class')::INTEGER,
--   student_number = COALESCE(r.meta->>'id', r.meta->>'studentId')
-- FROM resource r
-- WHERE
--   p.role = 'student'
--   AND p.name IS NULL
--   AND (r.meta->>'id' = SPLIT_PART(p.email, '@', 1) OR r.meta->>'studentId' = SPLIT_PART(p.email, '@', 1));

-- 3. 인덱스 생성 (선택적)
CREATE INDEX IF NOT EXISTS idx_profiles_grade ON profiles(grade) WHERE role = 'student';
CREATE INDEX IF NOT EXISTS idx_profiles_student_number ON profiles(student_number) WHERE role = 'student';

-- 완료
COMMENT ON COLUMN profiles.name IS '사용자 이름 (student만 필수)';
COMMENT ON COLUMN profiles.grade IS '학년 (1, 2, 3) - student만';
COMMENT ON COLUMN profiles.class IS '반 - student만';
COMMENT ON COLUMN profiles.student_number IS '학번 - student만';
