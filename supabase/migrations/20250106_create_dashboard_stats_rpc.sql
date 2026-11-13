CREATE OR REPLACE FUNCTION get_dashboard_statistics(
  p_today DATE,
  p_week_start DATE,
  p_week_end DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today_applicants INT;
  v_today_by_grade JSONB;
  v_weekly_applicants INT;
  v_weekly_by_grade JSONB;
  v_total_attendance_rate NUMERIC;
  v_attendance_rate_by_grade JSONB;
  
  v_total_attended INT;
  v_valid_total INT;
  v_is_past_closing_time BOOLEAN;
BEGIN
  -- Check if it is past 23:00 KST (Asia/Seoul)
  -- This aligns with the client-side logic: new Date().getHours() >= 23
  v_is_past_closing_time := (EXTRACT(HOUR FROM (now() AT TIME ZONE 'Asia/Seoul')) >= 23);
  
  -- 1. Today Applicants (reservation_date = p_today)
  SELECT 
    COALESCE(SUM(count), 0),
    COALESCE(jsonb_object_agg(grade, count), '{}'::jsonb)
  INTO v_today_applicants, v_today_by_grade
  FROM (
    SELECT p.grade::text, COUNT(*) as count
    FROM seat_reservations r
    JOIN profiles p ON r.student_id = p.id
    WHERE r.reservation_date = p_today
    GROUP BY p.grade
  ) t;
  
  -- 2. Weekly Applicants (reservation_date BETWEEN p_week_start AND p_week_end)
  SELECT 
    COALESCE(SUM(count), 0),
    COALESCE(jsonb_object_agg(grade, count), '{}'::jsonb)
  INTO v_weekly_applicants, v_weekly_by_grade
  FROM (
    SELECT p.grade::text, COUNT(*) as count
    FROM seat_reservations r
    JOIN profiles p ON r.student_id = p.id
    WHERE r.reservation_date >= p_week_start AND r.reservation_date <= p_week_end
    GROUP BY p.grade
  ) t;

  -- 3. Attendance Rates (reservation_date <= p_today)
  WITH attendance_data AS (
    SELECT 
      p.grade,
      CASE 
        WHEN r.is_attended THEN 1 
        ELSE 0 
      END as is_attended_val,
      CASE 
        WHEN r.is_attended OR r.reservation_date < p_today OR (r.reservation_date = p_today AND v_is_past_closing_time) THEN 1
        ELSE 0
      END as is_valid_val
    FROM seat_reservations r
    JOIN profiles p ON r.student_id = p.id
    WHERE r.reservation_date <= p_today
  ),
  aggregated AS (
    SELECT 
      grade,
      SUM(is_attended_val) as attended_count,
      SUM(is_valid_val) as valid_count
    FROM attendance_data
    GROUP BY grade
  )
  SELECT 
    COALESCE(SUM(valid_count), 0),
    COALESCE(SUM(attended_count), 0),
    COALESCE(jsonb_object_agg(grade::text, CASE WHEN valid_count > 0 THEN ROUND((attended_count::numeric / valid_count) * 100) ELSE 0 END), '{}'::jsonb)
  INTO v_valid_total, v_total_attended, v_attendance_rate_by_grade
  FROM aggregated;

  IF v_valid_total > 0 THEN
    v_total_attendance_rate := ROUND((v_total_attended::numeric / v_valid_total) * 100);
  ELSE
    v_total_attendance_rate := 0;
  END IF;

  RETURN jsonb_build_object(
    'todayApplicants', COALESCE(v_today_applicants, 0),
    'todayApplicantsByGrade', COALESCE(v_today_by_grade, '{}'::jsonb),
    'weeklyApplicants', COALESCE(v_weekly_applicants, 0),
    'weeklyApplicantsByGrade', COALESCE(v_weekly_by_grade, '{}'::jsonb),
    'averageAttendanceRate', COALESCE(v_total_attendance_rate, 0),
    'attendanceRateByGrade', COALESCE(v_attendance_rate_by_grade, '{}'::jsonb)
  );
END;
$$;
