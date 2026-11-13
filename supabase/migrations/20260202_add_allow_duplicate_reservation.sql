-- 1) study_rooms에 중복 신청 허용 컬럼 추가
ALTER TABLE study_rooms
ADD COLUMN IF NOT EXISTS allow_duplicate_reservation BOOLEAN DEFAULT false;

-- 2) 기존 UNIQUE 제약 변경: room_id 포함하여 다른 열람실 예약 허용
ALTER TABLE seat_reservations DROP CONSTRAINT IF EXISTS unique_student_reservation;
ALTER TABLE seat_reservations
ADD CONSTRAINT unique_student_reservation UNIQUE (student_id, room_id, reservation_date, period_id);
