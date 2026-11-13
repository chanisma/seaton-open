-- 운영 요일 배열 컬럼 추가
-- operating_days: 운영하는 요일 (0=일, 1=월, ..., 6=토)
-- 예: [1,2,3,4,5] = 평일, [6] = 토요일만, [1,2,3,4,5,6] = 평일+토
ALTER TABLE study_rooms
ADD COLUMN IF NOT EXISTS operating_days integer[] DEFAULT '{1,2,3,4,5}';

-- 기존 데이터 마이그레이션: is_saturday_open/is_sunday_open 값 반영
UPDATE study_rooms
SET operating_days =
  CASE
    WHEN is_saturday_open = true AND is_sunday_open = true THEN ARRAY[0,1,2,3,4,5,6]
    WHEN is_saturday_open = true THEN ARRAY[1,2,3,4,5,6]
    WHEN is_sunday_open = true THEN ARRAY[0,1,2,3,4,5]
    ELSE ARRAY[1,2,3,4,5]
  END
WHERE operating_days IS NULL OR operating_days = ARRAY[1,2,3,4,5];
