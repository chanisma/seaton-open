-- ============================================================================
-- 통계 페이지 서버 집계 RPC (2026-10-01)
--
-- 배경:
--   학생별 통계 / 일별 출석 / 요일별 교차표는 기간 내 seat_reservations 원본을
--   1000행씩 순차 페이징으로 받아 브라우저에서 집계했다.
--   (학기 기준 32,448행 · JSON 약 24MB · 요청 33회, 뒤 페이지일수록 OFFSET 비용 증가)
--   결과물은 학생 수백 명 단위 집계이므로 서버에서 집계해 1회 요청으로 반환한다.
--
-- 원칙:
--   - 기존 클라이언트 집계(statistics.service.ts)와 결과가 동일해야 한다.
--     "오늘"과 "23시 마감 경과 여부", 온도 증감 상수는 클라이언트가 넘긴다
--     (판정 기준을 한 곳(@utils/temperature, 클라이언트 시계)에 유지).
--   - 온도 변화량은 반올림하지 않은 합계를 반환하고 반올림은 클라이언트가 한다
--     (JS Math.round와 SQL round의 음수 .5 처리 차이 방지).
--   - SECURITY INVOKER: 호출자 RLS가 그대로 적용된다. 기존 PostgREST 직접 조회와 같은 권한.
--   - 읽기 전용(STABLE). 기존 객체는 변경하지 않는다.
--   - get_student_stats_bundle은 plpgsql + 동적 SQL(EXECUTE ... USING)로 매 호출을 실제 값으로
--     계획한다. LANGUAGE sql 버전은 일반 계획에서 학기 범위가 7초 이상 걸렸다
--     (교사 RLS 기준 측정: 1개월 73ms / 학기 535ms).
--   - 검증: 2026-09 실데이터 4개 시나리오(전체/학년/열람실/학년+열람실)에서
--     기존 클라이언트 집계 결과와 완전히 일치함을 확인.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 학생별 통계 + 일별 출석 번들
-- 반환 형태 (jsonb):
--   {
--     "rooms": [[room_id, room_name|null], ...],          -- att 항목이 인덱스로 참조
--     "students": [{
--        "id", "email", "name", "grade", "class", "sid", "number", "snum",
--        "total", "attended", "absent", "temp",              -- temp: 반올림 전 합계
--        "wr":  { "1": [room_name...], ..., "5": [...] },   -- 월~금 신청 열람실
--        "att": { "YYYY-MM-DD": [[period, status, checker_name|null, room_idx], ...] }
--     }]
--   }
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_student_stats_bundle(
  p_start date,
  p_end date,
  p_today date,
  p_past_closing boolean,
  p_attendance_increment float8,
  p_absence_decrement float8,
  p_grade int DEFAULT NULL,
  p_room_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
SET work_mem = '16MB'
AS $fn$
DECLARE
  v_filters text := '';
  v_result jsonb;
BEGIN
  -- 쓰지 않는 필터는 아예 빼고, 매 호출을 실제 값으로 계획한다(동적 SQL).
  -- LANGUAGE sql 버전은 일반(generic) 계획으로 "$x IS NULL OR ..." 조건의 추정이 틀어져
  -- 학기 범위에서 7초 이상 걸렸다.
  IF p_room_id IS NOT NULL THEN
    v_filters := v_filters || ' AND sr.room_id = $8';
  END IF;
  IF p_grade IS NOT NULL THEN
    v_filters := v_filters || ' AND p.email IN (
        SELECT res.meta->>''id'' || ''@myschool.hs.kr''
        FROM resource res
        WHERE res.meta->>''grade'' = $7::text)';
  END IF;

  EXECUTE $q$
  WITH rows AS (
    SELECT
      sr.id,
      sr.student_id,
      sr.room_id,
      sr.reservation_date AS d,
      sr.period_id,
      sr.is_attended,
      sr.attendance_status,
      c.name AS checker_name,
      r.name AS room_name,
      (sr.reservation_date < $3 OR (sr.reservation_date = $3 AND $4)) AS missed,
      -- 같은 날 여러 교시를 신청하면 온도 변화에 1/N 가중치
      count(*) OVER (PARTITION BY sr.student_id, sr.reservation_date) AS day_n
    FROM seat_reservations sr
    JOIN profiles p ON p.id = sr.student_id
    LEFT JOIN profiles c ON c.id = sr.checked_by
    LEFT JOIN study_rooms r ON r.id = sr.room_id
    WHERE sr.reservation_date BETWEEN $1 AND $2
    $q$ || v_filters || $q$
  ),
  rooms AS (
    SELECT room_id, max(room_name) AS room_name, (row_number() OVER (ORDER BY room_id)) - 1 AS idx
    FROM rows
    GROUP BY room_id
  ),
  agg AS (
    SELECT
      student_id,
      count(*) AS total,
      count(*) FILTER (WHERE is_attended) AS attended,
      count(*) FILTER (WHERE NOT coalesce(is_attended, false) AND missed) AS absent,
      sum(
        CASE
          WHEN is_attended THEN $5 * (1.0::float8 / day_n)
          WHEN missed THEN -$6 * (1.0::float8 / day_n)
          ELSE 0
        END
      ) AS temp
    FROM rows
    GROUP BY student_id
  ),
  weekday_rooms AS (
    SELECT student_id, jsonb_object_agg(dow::text, names) AS wr
    FROM (
      SELECT student_id, extract(isodow FROM d)::int AS dow, jsonb_agg(DISTINCT room_name) AS names
      FROM rows
      WHERE extract(isodow FROM d) BETWEEN 1 AND 5 AND room_name IS NOT NULL
      GROUP BY student_id, extract(isodow FROM d)
    ) per_dow
    GROUP BY student_id
  ),
  per_day AS (
    SELECT
      x.student_id,
      x.d,
      jsonb_agg(
        jsonb_build_array(
          x.period_id,
          CASE
            WHEN x.attendance_status = 'excused' THEN 'excused'
            WHEN x.is_attended THEN 'attended'
            WHEN x.missed THEN 'absent'
            ELSE 'none'
          END,
          x.checker_name,
          rm.idx
        )
        ORDER BY x.period_id, x.id
      ) AS entries
    FROM rows x
    JOIN rooms rm ON rm.room_id = x.room_id
    GROUP BY x.student_id, x.d
  ),
  attendance AS (
    SELECT student_id, jsonb_object_agg(d::text, entries) AS att
    FROM per_day
    GROUP BY student_id
  ),
  student_profiles AS (
    SELECT a.student_id, p.email, p.name, split_part(p.email, '@', 1) AS local_part
    FROM agg a
    JOIN profiles p ON p.id = a.student_id
  ),
  -- 대상 학생의 resource 행만 한 번에 조회 (학생마다 resource 전체를 다시 훑지 않도록)
  student_resources AS (
    SELECT res.id, res.name, res.meta, res.meta->>'id' AS sid
    FROM resource res
    WHERE res.meta->>'id' IN (SELECT local_part FROM student_profiles)
  ),
  -- fetchStudentNumbers(): 가장 큰 snumN(N>0) 값
  latest_snum AS (
    SELECT DISTINCT ON (sr2.sid) sr2.sid, sr2.meta->(k.key) AS snum
    FROM student_resources sr2
    CROSS JOIN LATERAL jsonb_object_keys(sr2.meta) AS k(key)
    WHERE k.key ~ '^snum[0-9]+'
      AND substring(k.key FROM '^snum([0-9]+)')::int > 0
    ORDER BY sr2.sid, substring(k.key FROM '^snum([0-9]+)')::int DESC
  ),
  identity AS (
    -- enrichWithResourceMeta(): 학번 형식(숫자/하이픈) 이메일만 resource.meta.id로 매칭
    SELECT
      sp.student_id,
      sp.email,
      CASE WHEN res.id IS NOT NULL THEN coalesce(nullif(sp.name, ''), res.name) ELSE sp.name END AS name,
      res.meta->'grade' AS grade,
      res.meta->'class' AS class,
      res.meta->'id' AS sid,
      res.meta->'number' AS number,
      ls.snum
    FROM student_profiles sp
    LEFT JOIN student_resources res
      ON sp.local_part ~ '^[0-9-]+$'
     AND res.sid = sp.local_part
    LEFT JOIN latest_snum ls ON ls.sid = sp.local_part
  )
  SELECT jsonb_build_object(
    'rooms', coalesce(
      (SELECT jsonb_agg(jsonb_build_array(room_id, room_name) ORDER BY idx) FROM rooms),
      '[]'::jsonb
    ),
    'students', coalesce(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', i.student_id,
            'email', i.email,
            'name', i.name,
            'grade', i.grade,
            'class', i.class,
            'sid', i.sid,
            'number', i.number,
            'snum', i.snum,
            'total', a.total,
            'attended', a.attended,
            'absent', a.absent,
            'temp', a.temp,
            'wr', '{"1": [], "2": [], "3": [], "4": [], "5": []}'::jsonb || coalesce(w.wr, '{}'::jsonb),
            'att', coalesce(t.att, '{}'::jsonb)
          )
        )
        FROM agg a
        JOIN identity i ON i.student_id = a.student_id
        LEFT JOIN attendance t ON t.student_id = a.student_id
        LEFT JOIN weekday_rooms w ON w.student_id = a.student_id
      ),
      '[]'::jsonb
    )
  )
  $q$
  INTO v_result
  USING p_start, p_end, p_today, p_past_closing,
        p_attendance_increment, p_absence_decrement, p_grade, p_room_id;

  RETURN v_result;
END;
$fn$;

-- ----------------------------------------------------------------------------
-- 요일별 신청 교차표 (열람실 × 요일)
-- 같은 날짜·열람실·학생은 교시가 여러 개여도 1건으로 센다.
-- by_day 키: 0=일 ~ 6=토 (JS Date.getDay와 동일)
-- unique_students: 월~금 신청 기준 고유 학생 수
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_weekday_crosstab(
  p_start date,
  p_end date,
  p_grade int DEFAULT NULL
)
RETURNS TABLE (room_id uuid, room_name text, by_day jsonb, total bigint, unique_students bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH base AS (
    SELECT DISTINCT sr.room_id, sr.reservation_date, sr.student_id
    FROM seat_reservations sr
    WHERE sr.reservation_date BETWEEN p_start AND p_end
      AND (
        p_grade IS NULL
        OR sr.student_id IN (
          SELECT p.id
          FROM profiles p
          JOIN resource res ON res.meta->>'id' || '@myschool.hs.kr' = p.email
          WHERE res.meta->>'grade' = p_grade::text
        )
      )
  ),
  d AS (
    SELECT b.*, extract(dow FROM b.reservation_date)::int AS dow FROM base b
  )
  SELECT
    d.room_id,
    coalesce(r.name, '알 수 없음'),
    jsonb_build_object(
      '0', count(*) FILTER (WHERE d.dow = 0),
      '1', count(*) FILTER (WHERE d.dow = 1),
      '2', count(*) FILTER (WHERE d.dow = 2),
      '3', count(*) FILTER (WHERE d.dow = 3),
      '4', count(*) FILTER (WHERE d.dow = 4),
      '5', count(*) FILTER (WHERE d.dow = 5),
      '6', count(*) FILTER (WHERE d.dow = 6)
    ),
    count(*),
    count(DISTINCT d.student_id) FILTER (WHERE d.dow BETWEEN 1 AND 5)
  FROM d
  LEFT JOIN study_rooms r ON r.id = d.room_id
  GROUP BY d.room_id, r.name;
$$;

-- 로그인 사용자만 호출 (함수 기본 EXECUTE 권한은 PUBLIC이므로 회수)
REVOKE ALL ON FUNCTION public.get_student_stats_bundle(date, date, date, boolean, float8, float8, int, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_student_stats_bundle(date, date, date, boolean, float8, float8, int, uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_weekday_crosstab(date, date, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_weekday_crosstab(date, date, int) TO authenticated;
