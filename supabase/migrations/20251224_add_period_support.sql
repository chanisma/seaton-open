-- Add period support to study_rooms
ALTER TABLE study_rooms 
ADD COLUMN IF NOT EXISTS use_periods BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS operating_periods JSONB DEFAULT '[]'::jsonb;

-- Add period support to seat_reservations
ALTER TABLE seat_reservations 
ADD COLUMN IF NOT EXISTS period_id INTEGER DEFAULT 0;

-- Drop old constraints
ALTER TABLE seat_reservations DROP CONSTRAINT IF EXISTS unique_student_reservation;
ALTER TABLE seat_reservations DROP CONSTRAINT IF EXISTS unique_seat_reservation;

-- Add new constraints including period_id
ALTER TABLE seat_reservations 
ADD CONSTRAINT unique_student_reservation UNIQUE (student_id, reservation_date, period_id);

ALTER TABLE seat_reservations 
ADD CONSTRAINT unique_seat_reservation UNIQUE (room_id, seat_number, reservation_date, period_id);
