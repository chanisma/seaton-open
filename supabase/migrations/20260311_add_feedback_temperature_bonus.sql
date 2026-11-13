-- 자기 평가(피드백) 작성 시 온도 +0.1 보너스 반영
-- Materialized View를 재생성하여 피드백 보너스 포함

-- 기존 뷰 및 인덱스 삭제
DROP MATERIALIZED VIEW IF EXISTS temperature_rankings_mv CASCADE;

-- 피드백 보너스를 포함한 새 Materialized View 생성
CREATE MATERIALIZED VIEW temperature_rankings_mv AS
WITH daily_stats AS (
  SELECT
    student_id,
    reservation_date,
    COUNT(*) as total_daily_reservations,
    COUNT(*) FILTER (WHERE is_attended = true) as attended_daily_reservations,
    COUNT(*) FILTER (WHERE is_attended = false AND reservation_date < CURRENT_DATE) as absent_daily_reservations
  FROM seat_reservations
  GROUP BY student_id, reservation_date
),
student_scores AS (
  SELECT
    student_id,
    SUM(
      (CAST(attended_daily_reservations AS float) * 0.5 / total_daily_reservations) -
      (CAST(absent_daily_reservations AS float) * 1.0 / total_daily_reservations)
    ) as total_score_change,
    SUM(
      CASE
        WHEN to_char(reservation_date, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM') THEN
          (CAST(attended_daily_reservations AS float) * 0.5 / total_daily_reservations) -
          (CAST(absent_daily_reservations AS float) * 1.0 / total_daily_reservations)
        ELSE 0
      END
    ) as monthly_score_change
  FROM daily_stats
  GROUP BY student_id
),
feedback_bonus AS (
  SELECT
    student_id,
    COUNT(*) FILTER (WHERE feedback_rating IS NOT NULL) * 0.1 as total_feedback_bonus,
    COUNT(*) FILTER (
      WHERE feedback_rating IS NOT NULL
        AND to_char(reservation_date, 'YYYY-MM') = to_char(CURRENT_DATE, 'YYYY-MM')
    ) * 0.1 as monthly_feedback_bonus
  FROM seat_reservations
  GROUP BY student_id
)
SELECT
  RANK() OVER (
    ORDER BY (28.0 + COALESCE(ss.total_score_change, 0) + COALESCE(fb.total_feedback_bonus, 0)) DESC, p.name ASC
  ) as rank,
  p.id as student_id,
  p.name,
  sbi.grade,
  sbi.class_num as class,
  ROUND(CAST(28.0 + COALESCE(ss.total_score_change, 0) + COALESCE(fb.total_feedback_bonus, 0) AS numeric), 1) as temperature,
  ROUND(CAST(COALESCE(ss.monthly_score_change, 0) + COALESCE(fb.monthly_feedback_bonus, 0) AS numeric), 1) as monthly_change
FROM profiles p
INNER JOIN student_scores ss ON p.id = ss.student_id
LEFT JOIN feedback_bonus fb ON p.id = fb.student_id
LEFT JOIN student_basic_info sbi ON sbi.id = split_part(p.email, '@', 1)
WHERE p.role = 'student'
ORDER BY temperature DESC, p.name ASC;

-- 인덱스 재생성
CREATE UNIQUE INDEX idx_temperature_rankings_student_id ON temperature_rankings_mv (student_id);
CREATE INDEX idx_temperature_rankings_temperature ON temperature_rankings_mv (temperature DESC);

-- calculate_student_temperature RPC도 피드백 보너스 반영
CREATE OR REPLACE FUNCTION calculate_student_temperature(student_uuid uuid)
RETURNS float
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result float;
BEGIN
  SELECT 28.0
    + COALESCE(SUM(
        (CAST(attended AS float) * 0.5 / total) -
        (CAST(absent AS float) * 1.0 / total)
      ), 0)
    + COALESCE((
        SELECT COUNT(*) * 0.1
        FROM seat_reservations
        WHERE student_id = student_uuid AND feedback_rating IS NOT NULL
      ), 0)
  INTO result
  FROM (
    SELECT
      reservation_date,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_attended = true) as attended,
      COUNT(*) FILTER (WHERE is_attended = false AND reservation_date < CURRENT_DATE) as absent
    FROM seat_reservations
    WHERE student_id = student_uuid
    GROUP BY reservation_date
  ) daily;

  RETURN ROUND(CAST(COALESCE(result, 28.0) AS numeric), 1);
END;
$$;

-- get_temperature_ranking RPC 재생성 (뷰가 재생성되었으므로)
CREATE OR REPLACE FUNCTION get_temperature_ranking()
RETURNS TABLE(
  rank bigint,
  student_id uuid,
  name text,
  grade integer,
  class integer,
  temperature numeric,
  monthly_change numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT rank, student_id, name, grade, class, temperature, monthly_change
  FROM temperature_rankings_mv
  ORDER BY rank ASC;
$$;

-- refresh 함수 재생성
CREATE OR REPLACE FUNCTION refresh_temperature_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY temperature_rankings_mv;
END;
$$;
