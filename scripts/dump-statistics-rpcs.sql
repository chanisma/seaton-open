-- ================================================================
-- 통계 RPC 정의 덤프 스크립트
--
-- 배경:
--   아래 4개 함수는 클라이언트(src/services/statistics.service.ts)가 호출하지만
--   supabase/migrations/ 에 정의가 없습니다. 즉 프로덕션 DB에만 존재하며
--   버전 관리 밖에 있어 재구축이 불가능한 상태입니다.
--
--     - get_grade_statistics
--     - get_monthly_statistics
--     - get_room_statistics
--     - get_overall_statistics
--
-- 사용법:
--   1. Supabase Dashboard > SQL Editor 에서 이 쿼리를 실행합니다.
--   2. 결과로 나온 CREATE FUNCTION 문 전체를 복사해
--      supabase/migrations/<날짜>_existing_statistics_rpcs.sql 로 저장하고 커밋합니다.
--
-- CLI 대안:
--   npx supabase login
--   npx supabase link --project-ref your-project-ref
--   npx supabase db dump --schema public -f supabase/migrations/<날짜>_public_schema.sql
--   (스키마 전체가 덤프되므로 필요한 함수만 발췌해 사용하세요)
-- ================================================================

SELECT
  p.proname AS function_name,
  pg_get_functiondef(p.oid) || ';' AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_grade_statistics',
    'get_monthly_statistics',
    'get_room_statistics',
    'get_overall_statistics'
  )
ORDER BY p.proname;
