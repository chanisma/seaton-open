-- 교시 미운영 열람실(use_periods = false)에 잘못 저장된 "교시별" 예약 정규화
--
-- 증상: [아침] 열람실 등 교시를 쓰지 않는 열람실에 period_id = 1, 2 행이 하루 2건씩 저장됨
--       (정상값은 종일을 뜻하는 period_id = 0, 하루 1건)
--
-- 원인: ReservationPage의 selectedPeriodIds/dayPeriodSelections 상태가 열람실 변경 시
--       초기화되지 않아, 직전에 선택한 교시 열람실의 교시 목록이 남은 채로 신청됨.
--       createReservation()이 이 값을 열람실 설정과 대조하지 않고 그대로 INSERT.
--       (코드 수정: src/services/reservation.service.ts, src/pages/ReservationPage.tsx)
--
-- 정책: 출결이 기록된 행(is_attended = true 또는 attendance_status not null)은 삭제하지 않는다.
--       - 그룹(학생·열람실·날짜) 내 출결 행이 0~1개 → 출결 행(없으면 최소 교시)만 남기고
--         period_id = 0 으로 정규화, 나머지 삭제
--       - 그룹 내 출결 행이 2개 이상 → 손대지 않음 (수동 확인 대상)

-- 1) 영향 행 전체 백업 (롤백 대비)
create table if not exists public.seat_reservations_period_fix_backup_20260901 as
select r.*, now() as backed_up_at
from public.seat_reservations r
join public.study_rooms sr on sr.id = r.room_id
where coalesce(sr.use_periods, false) = false
  and r.period_id is distinct from 0;

-- 2) 출결이 없는 중복 행만 삭제 (그룹당 1건 유지)
with bad as (
  select
    r.id,
    r.student_id,
    r.room_id,
    r.reservation_date,
    r.period_id,
    (r.is_attended is true or r.attendance_status is not null) as has_attendance
  from public.seat_reservations r
  join public.study_rooms sr on sr.id = r.room_id
  where coalesce(sr.use_periods, false) = false
    and r.period_id is distinct from 0
),
-- 출결 행이 2개 이상인 그룹은 제외 (삭제 금지)
fixable as (
  select b.*
  from bad b
  where (
    select count(*) from bad x
    where x.student_id = b.student_id
      and x.room_id = b.room_id
      and x.reservation_date = b.reservation_date
      and x.has_attendance
  ) <= 1
),
-- 그룹당 남길 행: 출결 있는 행 우선, 없으면 가장 낮은 교시
keep as (
  select distinct on (student_id, room_id, reservation_date) id
  from fixable
  order by student_id, room_id, reservation_date, has_attendance desc, period_id asc
)
delete from public.seat_reservations
where id in (select id from fixable)
  and id not in (select id from keep);

-- 3) 그룹에 홀로 남은 행을 종일(0)로 정규화
--    같은 학생/좌석에 다른 예약이 남아 있으면 UNIQUE 충돌 방지를 위해 건너뜀
update public.seat_reservations r
set period_id = 0
from public.study_rooms sr
where sr.id = r.room_id
  and coalesce(sr.use_periods, false) = false
  and r.period_id is distinct from 0
  and not exists (
    select 1 from public.seat_reservations d
    where d.id <> r.id
      and d.student_id = r.student_id
      and d.room_id = r.room_id
      and d.reservation_date = r.reservation_date
  )
  and not exists (
    select 1 from public.seat_reservations s
    where s.id <> r.id
      and s.room_id = r.room_id
      and s.seat_number = r.seat_number
      and s.reservation_date = r.reservation_date
      and s.period_id = 0
  );
