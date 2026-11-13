-- ============================================================================
-- 순공(방학학습) 기능
--   - study_rooms.is_sungong: 열람실 순공 여부 플래그
--   - seat_layout.seatZones:  좌석별 A/B반 (jsonb, 마이그레이션 불필요 - 문서화만)
--   - sungong_students:        순공 대상자 명단 (관리자 등록) + 약점(보완) 과목
--   - seat_reservations.attendance_status='supplement': 보완 출석 상태 (CHECK 없음)
-- ============================================================================

-- 1) 열람실 순공 여부 플래그
alter table study_rooms
  add column if not exists is_sungong boolean not null default false;

-- 2) 순공 대상자 명단 (관리자 등록, 명단제)
--    순공 열람실에 예약한 모든 학생이 순공은 아님 → 대상자를 명시적으로 등록
create table if not exists sungong_students (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references study_rooms(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  remedial_subject text, -- 약점(보완) 과목명. 보완 체크 교시에 표기됨
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sungong_students_unique unique (room_id, student_id)
);

create index if not exists idx_sungong_students_room on sungong_students(room_id);
create index if not exists idx_sungong_students_student on sungong_students(student_id);

alter table sungong_students enable row level security;

-- 학생은 본인 등록만 조회
create policy "Students view own sungong roster"
  on sungong_students for select
  using (student_id = auth.uid());

-- 교사/관리자는 전체 관리
create policy "Teachers manage sungong students"
  on sungong_students for all
  using (
    exists (select 1 from profiles where id = auth.uid() and role in ('teacher', 'admin'))
  )
  with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('teacher', 'admin'))
  );

-- 3) 보완 출석 상태
--    seat_reservations.attendance_status 는 CHECK 제약이 없으므로 값만 추가 사용.
--    NULL=미출석, 'attended'=출석, 'excused'=인정출석, 'supplement'=보완(순공)
comment on column seat_reservations.attendance_status is
  'NULL=미출석, attended=출석, excused=인정출석, supplement=보완(순공 약점보완)';
