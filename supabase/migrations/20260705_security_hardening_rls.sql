-- ============================================================
-- 보안 긴급 패치 (2026-07-05)
-- 확인된 문제 (pg_policies 직접 조회로 검증):
--   1) profiles.role: 본인 UPDATE 정책에 role 컬럼 제한이 없어 학생이 스스로
--      teacher/admin으로 권한 상승 가능. INSERT 정책도 role 값 제한 없음.
--   2) seat_reservations: "Students can update own reservations" 정책이
--      컬럼 제한 없이 본인 행 UPDATE를 허용 -> 학생이 자기 출석을 스스로 처리 가능.
--      INSERT 정책도 동일하게 출석 컬럼 제한이 없어 예약 생성 시점에 바로 출석 처리 가능.
--   3) point_transactions / seaton_badge_acquire / student_puzzle_progress /
--      student_puzzle_collection: 본인 확인만으로 직접 INSERT 허용 -> 포인트 위조,
--      임의 뱃지 자가 수여, 포인트 확인-차감 사이 레이스로 인한 이중 사용 가능.
--      puzzle.service.ts의 isAdmin 플래그도 클라이언트가 그대로 넘겨 검증 우회 가능.
-- ============================================================

-- ------------------------------------------------------------
-- 1) profiles.role 자가 변경 차단
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_prefix text;
  v_has_student_resource boolean;
BEGIN
  -- 관리자는 제한 없이 변경 가능
  IF is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role NOT IN ('student', 'teacher') THEN
      RAISE EXCEPTION '허용되지 않은 role 값입니다: %', NEW.role;
    END IF;
    RETURN NEW;
  END IF;

  -- TG_OP = 'UPDATE': role 값이 그대로면 통과
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  -- 유일하게 허용하는 자가 전환: 이메일 형식은 교사인데 role이 student로 잘못
  -- 등록된 경우의 자가 교정 (student -> teacher), 단 resource에 학생으로 등록된
  -- 기록이 없을 때만. 실제 학생은 resource에 기록이 있으므로 통과하지 못한다.
  v_user_prefix := split_part(NEW.email, '@', 1);
  SELECT EXISTS(
    SELECT 1 FROM resource
    WHERE type = 'student'
      AND (meta->>'id' = v_user_prefix OR meta->>'studentId' = v_user_prefix)
  ) INTO v_has_student_resource;

  IF OLD.role = 'student' AND NEW.role = 'teacher' AND NOT v_has_student_resource THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'role 컬럼은 본인이 변경할 수 없습니다.';
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON profiles;
CREATE TRIGGER trg_protect_profile_role
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION protect_profile_role();

-- ------------------------------------------------------------
-- 2) seat_reservations 출석 관련 컬럼 자가 조작 차단
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_attendance_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_staff boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  ) INTO v_is_staff;

  IF v_is_staff THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.is_attended IS TRUE
       OR NEW.attendance_status IS NOT NULL
       OR NEW.attended_at IS NOT NULL
       OR NEW.checked_by IS NOT NULL THEN
      RAISE EXCEPTION '출석 정보는 학생이 직접 설정할 수 없습니다.';
    END IF;
    RETURN NEW;
  END IF;

  -- TG_OP = 'UPDATE'
  IF NEW.is_attended IS DISTINCT FROM OLD.is_attended
     OR NEW.attendance_status IS DISTINCT FROM OLD.attendance_status
     OR NEW.attended_at IS DISTINCT FROM OLD.attended_at
     OR NEW.checked_by IS DISTINCT FROM OLD.checked_by THEN
    RAISE EXCEPTION '출석 정보는 학생이 직접 수정할 수 없습니다.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_attendance_columns ON seat_reservations;
CREATE TRIGGER trg_protect_attendance_columns
  BEFORE INSERT OR UPDATE ON seat_reservations
  FOR EACH ROW
  EXECUTE FUNCTION protect_attendance_columns();

-- ------------------------------------------------------------
-- 3) 포인트 / 뱃지 / 퍼즐 경제를 서버 검증 RPC로 이전
--    (직접 INSERT 정책 제거 -> 아래 SECURITY DEFINER 함수를 통해서만 기록 가능)
-- ------------------------------------------------------------

-- 3-1. 뱃지 획득: 온도 조건을 서버에서 재검증
CREATE OR REPLACE FUNCTION public.acquire_badge(p_badge_id integer)
RETURNS seaton_badge_acquire
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid := auth.uid();
  v_required_temp numeric;
  v_current_temp numeric;
  v_result seaton_badge_acquire;
BEGIN
  SELECT temperature INTO v_required_temp FROM seaton_badge WHERE id = p_badge_id;
  IF v_required_temp IS NULL THEN
    RAISE EXCEPTION '존재하지 않는 뱃지입니다.';
  END IF;

  v_current_temp := calculate_student_temperature(v_student_id);
  IF v_current_temp < v_required_temp THEN
    RAISE EXCEPTION '아직 온도가 부족합니다. (필요: %, 현재: %)', v_required_temp, v_current_temp;
  END IF;

  INSERT INTO seaton_badge_acquire (student_id, badge_id)
  VALUES (v_student_id, p_badge_id)
  ON CONFLICT (student_id, badge_id) DO NOTHING;

  SELECT * INTO v_result FROM seaton_badge_acquire
  WHERE student_id = v_student_id AND badge_id = p_badge_id;

  RETURN v_result;
END;
$$;

-- 3-2. 퍼즐 조각 오픈: 이벤트 상태/포인트 잔액/중복 오픈을 한 트랜잭션에서 검증
--      (isAdmin은 클라이언트 입력을 신뢰하지 않고 auth.uid()의 실제 role로 재확인)
CREATE OR REPLACE FUNCTION public.unlock_puzzle_piece(p_event_id uuid, p_piece_index integer)
RETURNS TABLE(piece_index integer, remaining_points integer, is_puzzle_completed boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid := auth.uid();
  v_is_staff boolean;
  v_event puzzle_events%ROWTYPE;
  v_already boolean;
  v_unlocked_count integer;
  v_balance integer;
BEGIN
  -- 같은 학생의 동시 요청을 직렬화 (잔액 확인-차감 사이 이중 사용 방지)
  PERFORM pg_advisory_xact_lock(hashtext(v_student_id::text));

  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = v_student_id AND role IN ('teacher', 'admin')
  ) INTO v_is_staff;

  SELECT * INTO v_event FROM puzzle_events WHERE id = p_event_id;
  IF v_event.id IS NULL THEN
    RAISE EXCEPTION '퍼즐 이벤트를 찾을 수 없습니다.';
  END IF;

  IF NOT v_is_staff THEN
    IF NOT v_event.is_active OR CURRENT_DATE < v_event.start_date OR CURRENT_DATE > v_event.end_date THEN
      RAISE EXCEPTION '현재 진행 중인 이벤트가 아닙니다.';
    END IF;
  END IF;

  IF p_piece_index < 0 OR p_piece_index >= v_event.total_pieces THEN
    RAISE EXCEPTION '유효하지 않은 조각 번호입니다.';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM student_puzzle_progress
    WHERE student_id = v_student_id AND event_id = p_event_id AND piece_index = p_piece_index
  ) INTO v_already;
  IF v_already THEN
    RAISE EXCEPTION '이미 오픈한 조각입니다.';
  END IF;

  IF NOT v_is_staff THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_balance
    FROM point_transactions WHERE student_id = v_student_id;

    IF v_balance < v_event.piece_cost THEN
      RAISE EXCEPTION '포인트가 부족합니다. (필요: %pt, 보유: %pt)', v_event.piece_cost, v_balance;
    END IF;

    INSERT INTO point_transactions (student_id, amount, type, reference_id, description)
    VALUES (
      v_student_id,
      -v_event.piece_cost,
      'puzzle_unlock',
      p_event_id::text || '_piece_' || p_piece_index,
      '퍼즐 조각 #' || (p_piece_index + 1) || ' 오픈'
    );
  END IF;

  INSERT INTO student_puzzle_progress (student_id, event_id, piece_index)
  VALUES (v_student_id, p_event_id, p_piece_index);

  SELECT COUNT(*) INTO v_unlocked_count FROM student_puzzle_progress
  WHERE student_id = v_student_id AND event_id = p_event_id;

  IF v_unlocked_count >= v_event.total_pieces THEN
    INSERT INTO student_puzzle_collection (student_id, event_id)
    VALUES (v_student_id, p_event_id)
    ON CONFLICT (student_id, event_id) DO NOTHING;
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_balance
  FROM point_transactions WHERE student_id = v_student_id;

  RETURN QUERY SELECT p_piece_index, v_balance, (v_unlocked_count >= v_event.total_pieces);
END;
$$;

-- 3-3. 집중 세션 포인트 적립: 세션 소유 확인 + duration_seconds로 서버가 직접 계산
--      (클라이언트가 별도 amount를 함께 보내지 않으므로 위조 불가, reference_id로 중복 적립 방지)
CREATE OR REPLACE FUNCTION public.award_focus_points(p_session_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid := auth.uid();
  v_session focus_forest_sessions%ROWTYPE;
  v_points integer;
  v_ref_id text;
BEGIN
  SELECT * INTO v_session FROM focus_forest_sessions
  WHERE id = p_session_id AND user_id = v_student_id;

  IF v_session.id IS NULL THEN
    RAISE EXCEPTION '세션을 찾을 수 없습니다.';
  END IF;

  v_ref_id := v_session.id::text;

  IF EXISTS (SELECT 1 FROM point_transactions WHERE reference_id = v_ref_id AND type = 'focus') THEN
    RETURN 0; -- 이미 적립됨 (재호출 시 중복 방지)
  END IF;

  v_points := LEAST(FLOOR(GREATEST(v_session.duration_seconds, 0) / 600), 12)::integer;
  IF v_points <= 0 THEN
    RETURN 0;
  END IF;

  INSERT INTO point_transactions (student_id, amount, type, reference_id, description)
  VALUES (v_student_id, v_points, 'focus', v_ref_id, '집중 세션 ' || (v_points * 10) || '분');

  RETURN v_points;
END;
$$;

GRANT EXECUTE ON FUNCTION public.acquire_badge(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_puzzle_piece(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_focus_points(uuid) TO authenticated;

-- 위 RPC들이 도입되었으므로 클라이언트의 직접 INSERT 경로를 제거한다.
DROP POLICY IF EXISTS "Authenticated users can create own transactions" ON point_transactions;
DROP POLICY IF EXISTS "Students can acquire badges" ON seaton_badge_acquire;
DROP POLICY IF EXISTS "Students can create own puzzle progress" ON student_puzzle_progress;
DROP POLICY IF EXISTS "Students can add to own puzzle collection" ON student_puzzle_collection;

-- ------------------------------------------------------------
-- 4) 학생이 온도 랭킹 MV 전체 리프레시를 무제한 호출하는 것 차단 (DoS 방지)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_temperature_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  ) THEN
    RAISE EXCEPTION '권한이 없습니다.';
  END IF;

  REFRESH MATERIALIZED VIEW CONCURRENTLY temperature_rankings_mv;
END;
$$;
