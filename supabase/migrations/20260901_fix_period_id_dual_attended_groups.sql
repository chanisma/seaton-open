-- 20260901_fix_period_id_on_non_period_rooms.sql 후속 정리
--
-- 앞선 마이그레이션은 "출결이 기록된 행은 삭제하지 않는다"는 정책으로,
-- 중복된 두 행 양쪽 모두 출석 처리된 11개 그룹(22건)을 남겨두었다.
-- 확인 결과 모두 과거 데이터이고 교사가 중복 좌석을 연달아 체크한 케이스이므로 정리한다.
--
-- 남길 행: 먼저 출석 체크된 행(attended_at 오름차순, 동률이면 낮은 교시) = 원본 체크
-- 삭제 행: 뒤늦게 찍힌 중복 체크
-- 원본 22건은 seat_reservations_period_fix_backup_20260901 에 이미 백업되어 있다.

-- 1) 그룹당 최초 출석 행만 남기고 중복 삭제
with bad as (
  select
    r.id,
    r.student_id,
    r.room_id,
    r.reservation_date,
    r.period_id,
    r.attended_at
  from public.seat_reservations r
  join public.study_rooms sr on sr.id = r.room_id
  where coalesce(sr.use_periods, false) = false
    and r.period_id is distinct from 0
),
keep as (
  select distinct on (student_id, room_id, reservation_date) id
  from bad
  order by student_id, room_id, reservation_date, attended_at asc nulls last, period_id asc
)
delete from public.seat_reservations
where id in (select id from bad)
  and id not in (select id from keep);

-- 2) 남은 행을 종일(0)로 정규화 (UNIQUE 충돌 방지 가드 포함)
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
