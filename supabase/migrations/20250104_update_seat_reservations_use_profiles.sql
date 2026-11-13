-- ================================================================
-- Migration: Update seat_reservations to use profiles.id
-- Date: 2025-01-04
-- Description:
--   - seat_reservations.student_id를 resource.id 대신 profiles.id 참조
--   - RLS 정책 수정 (profiles.id 직접 사용)
-- ================================================================

-- 1. 기존 테이블 삭제 (RLS 정책 포함)
DROP TABLE IF EXISTS seat_reservations CASCADE;

-- 2. seat_reservations 테이블 재생성
CREATE TABLE seat_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- profiles.id 참조로 변경
  room_id UUID NOT NULL REFERENCES study_rooms(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  is_attended BOOLEAN DEFAULT FALSE,
  attended_at TIMESTAMPTZ,
  checked_by UUID REFERENCES profiles(id), -- 출석 체크한 교사 (profiles.id)
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 제약 조건
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

-- 학생: 자신의 예약만 조회 가능
CREATE POLICY "Students can view own reservations"
  ON seat_reservations
  FOR SELECT
  USING (
    auth.uid() = student_id
  );

-- 학생: 자신의 예약만 생성 가능
CREATE POLICY "Students can create own reservations"
  ON seat_reservations
  FOR INSERT
  WITH CHECK (
    auth.uid() = student_id
  );

-- 학생: 자신의 예약만 삭제 가능
CREATE POLICY "Students can delete own reservations"
  ON seat_reservations
  FOR DELETE
  USING (
    auth.uid() = student_id
  );

-- 교사: 모든 예약 조회 가능
CREATE POLICY "Teachers can view all reservations"
  ON seat_reservations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

-- 교사: 출석 체크 가능 (UPDATE)
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

-- 6. 트리거: updated_at 자동 업데이트 (선택적)
-- CREATE TRIGGER update_seat_reservations_updated_at
--   BEFORE UPDATE ON seat_reservations
--   FOR EACH ROW
--   EXECUTE FUNCTION update_updated_at_column();

-- 완료
COMMENT ON TABLE seat_reservations IS '자리 신청 정보 (student_id는 profiles.id 참조)';
COMMENT ON COLUMN seat_reservations.student_id IS '학생 프로필 ID (profiles.id)';
COMMENT ON COLUMN seat_reservations.checked_by IS '출석 체크한 교사 ID (profiles.id)';
