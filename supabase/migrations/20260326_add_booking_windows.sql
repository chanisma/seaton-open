-- 멀티 예약 접수 기간 지원을 위한 booking_windows 컬럼 추가
-- 기존 booking_start_date / booking_end_date는 레거시 호환용으로 유지

ALTER TABLE study_rooms
ADD COLUMN IF NOT EXISTS booking_windows jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN study_rooms.booking_windows IS '멀티 예약 접수 기간. [{id, label?, start, end}, ...]';

-- 기존 단일 접수 기간 데이터를 booking_windows로 마이그레이션
UPDATE study_rooms
SET booking_windows = jsonb_build_array(
  jsonb_build_object(
    'id', 1,
    'label', '1차 접수',
    'start', booking_start_date,
    'end', booking_end_date
  )
)
WHERE booking_start_date IS NOT NULL
  AND booking_end_date IS NOT NULL
  AND (booking_windows IS NULL OR booking_windows = '[]'::jsonb);
