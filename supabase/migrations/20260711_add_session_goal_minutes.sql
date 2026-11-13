-- Focus Forest: 세션 목표 시간(분) 저장 컬럼 (null = 무제한/미설정)
ALTER TABLE public.focus_forest_data ADD COLUMN IF NOT EXISTS session_goal_minutes integer;
