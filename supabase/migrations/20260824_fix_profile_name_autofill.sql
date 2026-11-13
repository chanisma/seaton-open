-- 2026-08-24: profiles.name이 NULL로 남는 문제 수정
--
-- 배경:
--   auth.users의 on_auth_user_created 트리거(handle_existing_user_profile)가
--   프로필 행을 만들 때 name을 채우지 않아, 학생 489명 중 36명의 name이 NULL이었다.
--   앱(auth.service.ts)이 로그인 시 resource.name으로 백필하지만 await하지 않는
--   fire-and-forget 업데이트라 반영이 보장되지 않았다.
--   UI(AttendanceSeat.tsx)는 profiles.name만 읽으므로 해당 학생 이름이 표시되지 않았다.
--
-- 조치:
--   1) resolve_profile_name(): 이메일 -> resource.name 조회 헬퍼
--   2) handle_existing_user_profile(): 계정 생성 시 name까지 INSERT
--   3) update_last_login(): 매 로그인마다 name이 비어 있으면 자가 복구
--   4) 기존 NULL 데이터 백필

-- ---------------------------------------------------------------------------
-- 1) 이메일 -> 실명 해석 헬퍼
--    학생: resource.meta->>'id' (학번) == 이메일 아이디
--    교직원: resource.meta->>'email' == 이메일 전체
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_profile_name(p_email text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT r.name
  FROM public.resource r
  WHERE r.name IS NOT NULL
    AND (
      (r.type = 'student' AND r.meta->>'id' = split_part(p_email, '@', 1))
      OR (r.type IN ('teacher', 'staff') AND lower(r.meta->>'email') = lower(p_email))
    )
  ORDER BY (r.status = 'active') DESC NULLS LAST
  LIMIT 1;
$$;

-- 이름 조회 오라클로 악용되지 않도록 기본 PUBLIC 실행 권한 회수
REVOKE ALL ON FUNCTION public.resolve_profile_name(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_profile_name(text) FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) 계정 생성 시 name까지 채우기
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_existing_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  email_prefix TEXT;
  user_role TEXT;
  v_name TEXT;
BEGIN
  email_prefix := split_part(NEW.email, '@', 1);

  -- 학생 계정 패턴: 숫자2자리-로 시작 (예: user233@example.com)
  IF email_prefix ~ '^\d{2}-' THEN
    user_role := 'student';
  ELSE
    user_role := 'teacher';
  END IF;

  v_name := public.resolve_profile_name(NEW.email);

  -- 프로필이 없으면 생성, 있으면 비어 있는 nickname/name만 보충
  INSERT INTO public.profiles AS p (id, email, nickname, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    v_name,
    user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    nickname   = COALESCE(p.nickname, EXCLUDED.nickname),
    name       = COALESCE(p.name, EXCLUDED.name),
    email      = EXCLUDED.email,
    updated_at = NOW()
  WHERE p.nickname IS NULL OR p.name IS NULL;

  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 3) 매 로그인마다 name 자가 복구
--    이름 복구가 실패해도 로그인은 절대 막지 않는다.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  BEGIN
    UPDATE public.profiles p
    SET last_login = now(),
        name = COALESCE(NULLIF(p.name, ''), public.resolve_profile_name(NEW.email))
    WHERE p.id = NEW.id;
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.profiles SET last_login = now() WHERE id = NEW.id;
  END;

  RETURN NEW;
END;
$function$;

-- ---------------------------------------------------------------------------
-- 4) 기존 NULL 백필 (재실행 안전)
-- ---------------------------------------------------------------------------
UPDATE public.profiles p
SET name = public.resolve_profile_name(p.email),
    updated_at = now()
WHERE NULLIF(p.name, '') IS NULL
  AND public.resolve_profile_name(p.email) IS NOT NULL;
