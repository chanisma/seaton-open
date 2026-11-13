-- ================================================================
-- Migration: Add by_grade to get_daily_statistics RPC
-- Date: 2026-03-05
-- Description:
--   get_daily_statistics RPC가 by_grade JSONB 필드를 반환하지 않아
--   주별 통계에서 학년별 출석률이 항상 0%로 표시되는 버그 수정
-- ================================================================

DROP FUNCTION IF EXISTS get_daily_statistics(date, date, integer);

CREATE OR REPLACE FUNCTION get_daily_statistics(
    start_date date,
    end_date date,
    target_grade integer DEFAULT NULL
)
RETURNS TABLE(date text, total_reservations bigint, attended bigint, attendance_rate integer, by_grade jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH daily_grade_data AS (
        SELECT
            sr.reservation_date,
            (res.meta->>'grade')::int as grade,
            count(*) as total,
            count(*) FILTER (WHERE sr.is_attended) as attended_count
        FROM seat_reservations sr
        JOIN profiles p ON sr.student_id = p.id
        LEFT JOIN resource res ON res.meta->>'id' = split_part(p.email, '@', 1)
        WHERE sr.reservation_date BETWEEN start_date AND end_date
        AND res.meta->>'grade' IS NOT NULL
        AND (target_grade IS NULL OR (res.meta->>'grade')::int = target_grade)
        GROUP BY sr.reservation_date, (res.meta->>'grade')::int
    ),
    daily_totals AS (
        SELECT
            dgd.reservation_date,
            sum(dgd.total) as total_res,
            sum(dgd.attended_count) as total_att
        FROM daily_grade_data dgd
        GROUP BY dgd.reservation_date
    )
    SELECT
        dt.reservation_date::text,
        dt.total_res::bigint,
        dt.total_att::bigint,
        CASE WHEN dt.total_res > 0
            THEN round((dt.total_att::numeric / dt.total_res::numeric) * 100)::int
            ELSE 0
        END,
        COALESCE(
            jsonb_object_agg(
                dgd.grade,
                jsonb_build_object(
                    'total_reservations', dgd.total,
                    'attended', dgd.attended_count
                )
            ),
            '{}'::jsonb
        )
    FROM daily_totals dt
    JOIN daily_grade_data dgd ON dt.reservation_date = dgd.reservation_date
    GROUP BY dt.reservation_date, dt.total_res, dt.total_att
    ORDER BY dt.reservation_date;
END;
$$;
