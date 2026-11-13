-- ================================================================
-- Migration: 학생 목록 기준 온도 조회 RPC 추가
-- Date: 2026-07-28
-- Description:
--   통계 화면은 학년/열람실 필터가 걸린 일부 학생의 온도만 필요한데
--   기존 get_temperature_ranking()은 인자가 없어 전교생 랭킹을 통째로 반환했습니다.
--   (클라이언트가 받아서 다시 필터링하는 구조)
--
--   필요한 학생만 조회하는 RPC를 추가합니다.
--   클라이언트(statistics.service.ts)는 이 함수가 없는 환경에서는
--   기존 전체 랭킹 경로로 자동 폴백하므로, 적용 전후 모두 동작합니다.
-- ================================================================

-- 적용 완료: 2026-07-28, 원격 마이그레이션 버전 add_filtered_temperature_rpc
CREATE OR REPLACE FUNCTION public.get_temperatures_for_students(student_ids uuid[])
RETURNS TABLE(
  student_id uuid,
  temperature numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT mv.student_id, mv.temperature
  FROM temperature_rankings_mv mv
  WHERE mv.student_id = ANY(student_ids);
$function$;

GRANT EXECUTE ON FUNCTION public.get_temperatures_for_students(uuid[]) TO authenticated;
