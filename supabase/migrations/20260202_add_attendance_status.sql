-- 인정출석 기능을 위한 attendance_status 컬럼 추가
-- 값: NULL = 미출석, 'attended' = 일반 출석, 'excused' = 인정출석

ALTER TABLE seat_reservations
ADD COLUMN IF NOT EXISTS attendance_status TEXT DEFAULT NULL;

-- 기존 출석 데이터 마이그레이션
UPDATE seat_reservations
SET attendance_status = 'attended'
WHERE is_attended = true AND attendance_status IS NULL;
