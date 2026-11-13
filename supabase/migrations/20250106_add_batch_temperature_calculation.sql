CREATE OR REPLACE FUNCTION public.calculate_student_temperatures_batch(student_uuids uuid[])
 RETURNS TABLE(student_id uuid, temperature double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT s.id, calculate_student_temperature(s.id)
    FROM unnest(student_uuids) as s(id);
END;
$function$
