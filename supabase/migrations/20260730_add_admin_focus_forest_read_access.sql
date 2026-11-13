-- 관리자만 모든 사용자의 Focus Forest 데이터를 읽을 수 있습니다.
-- 기존 본인 조회/쓰기 정책은 그대로 유지하며 관리자에게 SELECT만 추가합니다.

drop policy if exists "Admins can read all focus forest data"
  on public.focus_forest_data;

create policy "Admins can read all focus forest data"
  on public.focus_forest_data
  for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can read all completed forests"
  on public.focus_forest_completed;

create policy "Admins can read all completed forests"
  on public.focus_forest_completed
  for select
  to authenticated
  using ((select public.is_admin()));

drop policy if exists "Admins can read all focus forest sessions"
  on public.focus_forest_sessions;

create policy "Admins can read all focus forest sessions"
  on public.focus_forest_sessions
  for select
  to authenticated
  using ((select public.is_admin()));
