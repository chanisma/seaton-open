-- ================================================================
-- Migration: 통계 RPC 4종 정의 버전 관리 편입
-- Date: 2026-07-28
-- Description:
--   아래 4개 함수는 클라이언트(src/services/statistics.service.ts)가 호출하지만
--   그동안 supabase/migrations/ 에 정의가 없어 프로덕션 DB에만 존재했습니다.
--   (재구축 불가 / 변경 이력 추적 불가 상태)
--
--   프로덕션에서 pg_get_functiondef 로 덤프한 정의를 그대로 옮겨 적습니다.
--   기존 동작을 바꾸지 않는 순수 문서화용 마이그레이션입니다.
--
--   ⚠️ 이 4개는 SECURITY DEFINER가 아닙니다(호출자 권한 = RLS 적용).
--      반면 get_daily_statistics 는 SECURITY DEFINER 입니다. 의도된 차이인지
--      확인이 필요하면 별도로 다루세요.
--
--   덤프 방법은 scripts/dump-statistics-rpcs.sql 참고.
-- ================================================================

-- ----------------------------------------------------------------
-- 학년별 통계
-- 주의: attendance_rate 분모가 '전체 신청'이라 미래 예약도 포함됩니다.
--       (get_overall_statistics 와 분모 정의가 다름)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_grade_statistics(
    start_date date,
    end_date date,
    target_grade integer DEFAULT NULL::integer
)
RETURNS TABLE(grade integer, total_reservations bigint, attended bigint, attendance_rate integer)
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        (res.meta->>'grade')::int as grade,
        count(*)::bigint as total_reservations,
        count(*) FILTER (WHERE sr.is_attended)::bigint as attended,
        CASE WHEN count(*) > 0 THEN round((count(*) FILTER (WHERE sr.is_attended)::numeric / count(*)::numeric) * 100)::int ELSE 0 END as attendance_rate
    FROM seat_reservations sr
    JOIN profiles p ON sr.student_id = p.id
    LEFT JOIN resource res ON res.meta->>'id' = split_part(p.email, '@', 1)
    WHERE sr.reservation_date BETWEEN start_date AND end_date
    AND res.meta->>'grade' IS NOT NULL
    AND (target_grade IS NULL OR (res.meta->>'grade')::int = target_grade)
    GROUP BY res.meta->>'grade'
    ORDER BY (res.meta->>'grade')::int;
END;
$function$;

-- ----------------------------------------------------------------
-- 월별 통계
-- 주의: by_grade 키가 camelCase(totalReservations/attended/attendanceRate)입니다.
--       get_daily_statistics 의 by_grade 는 snake_case 라 서로 다릅니다.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_monthly_statistics(
    start_date date,
    end_date date,
    target_grade integer DEFAULT NULL::integer
)
RETURNS TABLE(month text, total_reservations bigint, attended bigint, attendance_rate integer, by_grade jsonb)
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT
            to_char(sr.reservation_date, 'YYYY-MM') as m,
            (res.meta->>'grade')::int as grade,
            count(*) as total,
            count(*) FILTER (WHERE sr.is_attended) as attended_count
        FROM seat_reservations sr
        JOIN profiles p ON sr.student_id = p.id
        LEFT JOIN resource res ON res.meta->>'id' = split_part(p.email, '@', 1)
        WHERE sr.reservation_date BETWEEN start_date AND end_date
        AND res.meta->>'grade' IS NOT NULL
        AND (target_grade IS NULL OR (res.meta->>'grade')::int = target_grade)
        GROUP BY to_char(sr.reservation_date, 'YYYY-MM'), res.meta->>'grade'
    ),
    monthly_totals AS (
        SELECT m, sum(total) as total_res, sum(attended_count) as total_att
        FROM monthly_data
        GROUP BY m
    )
    SELECT
        mt.m as month,
        mt.total_res::bigint,
        mt.total_att::bigint,
        CASE WHEN mt.total_res > 0 THEN round((mt.total_att::numeric / mt.total_res::numeric) * 100)::int ELSE 0 END,
        jsonb_object_agg(
            md.grade,
            jsonb_build_object(
                'totalReservations', md.total,
                'attended', md.attended_count,
                'attendanceRate', CASE WHEN md.total > 0 THEN round((md.attended_count::numeric / md.total::numeric) * 100)::int ELSE 0 END
            )
        )
    FROM monthly_totals mt
    JOIN monthly_data md ON mt.m = md.m
    GROUP BY mt.m, mt.total_res, mt.total_att
    ORDER BY mt.m;
END;
$function$;

-- ----------------------------------------------------------------
-- 전체 통계
-- 결석은 '이미 지난 예약 중 미출석'만 셉니다(23시 마감 규칙 포함).
-- 출석률 분모도 출석+결석이라 미래 예약은 제외됩니다.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_overall_statistics(
    start_date date,
    end_date date,
    target_grade integer DEFAULT NULL::integer
)
RETURNS TABLE(total_reservations bigint, total_attended bigint, total_absent bigint, overall_attendance_rate integer, unique_students bigint, active_rooms bigint)
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    today date := current_date;
    is_past_closing_time boolean := extract(hour from now()) >= 23;
BEGIN
    RETURN QUERY
    SELECT
        count(*)::bigint,
        count(*) FILTER (WHERE sr.is_attended)::bigint,
        count(*) FILTER (WHERE NOT sr.is_attended AND (sr.reservation_date < today OR (sr.reservation_date = today AND is_past_closing_time)))::bigint,
        CASE
            WHEN (count(*) FILTER (WHERE sr.is_attended) + count(*) FILTER (WHERE NOT sr.is_attended AND (sr.reservation_date < today OR (sr.reservation_date = today AND is_past_closing_time)))) > 0 THEN
                round((count(*) FILTER (WHERE sr.is_attended)::numeric / (count(*) FILTER (WHERE sr.is_attended) + count(*) FILTER (WHERE NOT sr.is_attended AND (sr.reservation_date < today OR (sr.reservation_date = today AND is_past_closing_time))))::numeric) * 100)::int
            ELSE 0
        END,
        count(DISTINCT sr.student_id)::bigint,
        count(DISTINCT sr.room_id)::bigint
    FROM seat_reservations sr
    JOIN profiles p ON sr.student_id = p.id
    LEFT JOIN resource res ON res.meta->>'id' = split_part(p.email, '@', 1)
    WHERE sr.reservation_date BETWEEN start_date AND end_date
    AND (target_grade IS NULL OR (res.meta->>'grade')::int = target_grade);
END;
$function$;

-- ----------------------------------------------------------------
-- 열람실별 통계
-- 결석/고유 학생 수는 반환하지 않으므로, 클라이언트가 열람실 필터를 걸면
-- 학생 번들에서 따로 계산합니다. (StatisticsDashboardPage 참고)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_room_statistics(
    start_date date,
    end_date date,
    target_grade integer DEFAULT NULL::integer
)
RETURNS TABLE(room_id uuid, room_name text, grade integer, total_reservations bigint, attended bigint, attendance_rate integer)
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        sr.room_id,
        r.name,
        r.grade,
        count(*)::bigint,
        count(*) FILTER (WHERE sr.is_attended)::bigint,
        CASE WHEN count(*) > 0 THEN round((count(*) FILTER (WHERE sr.is_attended)::numeric / count(*)::numeric) * 100)::int ELSE 0 END
    FROM seat_reservations sr
    JOIN study_rooms r ON sr.room_id = r.id
    JOIN profiles p ON sr.student_id = p.id
    LEFT JOIN resource res ON res.meta->>'id' = split_part(p.email, '@', 1)
    WHERE sr.reservation_date BETWEEN start_date AND end_date
    AND (target_grade IS NULL OR (res.meta->>'grade')::int = target_grade)
    GROUP BY sr.room_id, r.name, r.grade
    ORDER BY r.grade, r.name;
END;
$function$;
