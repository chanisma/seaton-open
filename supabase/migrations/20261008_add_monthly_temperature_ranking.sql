-- ================================================================
-- Migration: 월별 온도 랭킹 RPC 추가
-- Date: 2026-10-08
-- Description:
--   온도 랭킹 화면의 "월별" 보기용. 선택한 달에 쌓은 온도 변화량으로 순위를 매깁니다.
--   점수 규칙은 temperature_rankings_mv의 monthly_change와 동일합니다.
--     - 날짜별로 (출석 수 * 0.5 - 결석 수 * 1.0) / 그날 예약 수
--     - 결석은 오늘 이전 날짜만 집계
--     - 자기 평가(feedback_rating) 1건당 +0.1
--   집계 규칙을 바꾸면 temperature_rankings_mv와 이 함수를 함께 수정하세요.
--
--   한 달치 예약만 읽으므로 MV 없이 매번 계산합니다(새로고침 불필요).
--   온도 변화가 같으면 공동 순위입니다.
-- ================================================================

CREATE OR REPLACE FUNCTION public.get_monthly_temperature_ranking(p_month date)
RETURNS TABLE(
  rank bigint,
  student_id uuid,
  name text,
  grade integer,
  class integer,
  monthly_change numeric,
  attended_days integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
  WITH month_reservations AS (
    SELECT sr.student_id, sr.reservation_date, sr.is_attended, sr.feedback_rating
    FROM seat_reservations sr
    WHERE sr.reservation_date >= date_trunc('month', p_month)::date
      AND sr.reservation_date < (date_trunc('month', p_month) + interval '1 month')::date
  ),
  daily_stats AS (
    SELECT
      mr.student_id,
      mr.reservation_date,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE mr.is_attended = true) AS attended,
      COUNT(*) FILTER (WHERE mr.is_attended = false AND mr.reservation_date < CURRENT_DATE) AS absent
    FROM month_reservations mr
    GROUP BY mr.student_id, mr.reservation_date
  ),
  student_scores AS (
    SELECT
      ds.student_id,
      SUM(
        (CAST(ds.attended AS float) * 0.5 / ds.total) -
        (CAST(ds.absent AS float) * 1.0 / ds.total)
      ) AS score_change,
      COUNT(*) FILTER (WHERE ds.attended > 0)::integer AS attended_days
    FROM daily_stats ds
    GROUP BY ds.student_id
  ),
  feedback_bonus AS (
    SELECT mr.student_id, COUNT(*) * 0.1 AS bonus
    FROM month_reservations mr
    WHERE mr.feedback_rating IS NOT NULL
    GROUP BY mr.student_id
  ),
  scored AS (
    SELECT
      p.id AS student_id,
      COALESCE(p.name, sbi.name) AS name,
      sbi.grade,
      sbi.class_num AS class,
      ROUND(CAST(ss.score_change + COALESCE(fb.bonus, 0) AS numeric), 1) AS monthly_change,
      ss.attended_days
    FROM student_scores ss
    JOIN profiles p ON p.id = ss.student_id
    LEFT JOIN feedback_bonus fb ON fb.student_id = ss.student_id
    LEFT JOIN student_basic_info sbi ON sbi.id = split_part(p.email, '@', 1)
    WHERE p.role = 'student'
  )
  SELECT
    RANK() OVER (ORDER BY s.monthly_change DESC) AS rank,
    s.student_id,
    s.name,
    s.grade,
    s.class,
    s.monthly_change,
    s.attended_days
  FROM scored s
  ORDER BY s.monthly_change DESC, s.attended_days DESC, s.name ASC;
$function$;

REVOKE ALL ON FUNCTION public.get_monthly_temperature_ranking(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_monthly_temperature_ranking(date) TO authenticated;
