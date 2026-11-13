-- Create Materialized View for Temperature Rankings
CREATE MATERIALIZED VIEW IF NOT EXISTS temperature_rankings_mv AS
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
)
SELECT
  RANK() OVER (ORDER BY (28.0 + COALESCE(ss.total_score_change, 0)) DESC, p.name ASC) as rank,
  p.id as student_id,
  p.name,
  p.grade,
  p.class,
  ROUND(CAST(28.0 + COALESCE(ss.total_score_change, 0) AS numeric), 1) as temperature,
  ROUND(CAST(COALESCE(ss.monthly_score_change, 0) AS numeric), 1) as monthly_change
FROM profiles p
INNER JOIN student_scores ss ON p.id = ss.student_id
WHERE p.role = 'student'
ORDER BY temperature DESC, p.name ASC;

-- Create Unique Index for Concurrent Refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_temperature_rankings_student_id ON temperature_rankings_mv (student_id);
-- Create Index for Performance
CREATE INDEX IF NOT EXISTS idx_temperature_rankings_temperature ON temperature_rankings_mv (temperature DESC);

-- Update RPC to use Materialized View
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
  SELECT
    rank,
    student_id,
    name,
    grade,
    class,
    temperature,
    monthly_change
  FROM temperature_rankings_mv
  ORDER BY rank ASC;
$$;

-- Create RPC to refresh Materialized View
CREATE OR REPLACE FUNCTION refresh_temperature_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY temperature_rankings_mv;
END;
$$;
