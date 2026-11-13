-- Keep focus forest reads private to the owner while allowing admins to inspect
-- every user's data. A single policy per table avoids evaluating two permissive
-- SELECT policies for each request.

drop policy if exists "Users can read own focus forest data"
  on public.focus_forest_data;
drop policy if exists "Admins can read all focus forest data"
  on public.focus_forest_data;

create policy "Owners and admins can read focus forest data"
  on public.focus_forest_data
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or (select public.is_admin())
  );

drop policy if exists "Users can read own completed forests"
  on public.focus_forest_completed;
drop policy if exists "Admins can read all completed forests"
  on public.focus_forest_completed;

create policy "Owners and admins can read completed forests"
  on public.focus_forest_completed
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or (select public.is_admin())
  );

drop policy if exists "Users can read own sessions"
  on public.focus_forest_sessions;
drop policy if exists "Admins can read all focus forest sessions"
  on public.focus_forest_sessions;

create policy "Owners and admins can read focus forest sessions"
  on public.focus_forest_sessions
  for select
  to authenticated
  using (
    (select auth.uid()) = user_id
    or (select public.is_admin())
  );
