-- Focus Forest: 사용자별 집중 숲 데이터
create table if not exists focus_forest_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  total_focus_seconds integer not null default 0,
  longest_session_seconds integer not null default 0,
  current_forest_index integer not null default 1,
  animal_collection jsonb not null default '{}',
  daily_records jsonb not null default '[]',
  saved_trees jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint focus_forest_data_user_unique unique (user_id)
);

-- Focus Forest: 완성된 숲 기록
create table if not exists focus_forest_completed (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  forest_index integer not null,
  completed_at timestamptz not null default now(),
  total_trees integer not null default 120,
  focus_time_seconds integer not null default 0,
  tree_positions jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- Focus Forest: 세션 기록
create table if not exists focus_forest_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_seconds integer not null,
  trees_planted integer not null default 0,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_focus_forest_data_user on focus_forest_data(user_id);
create index if not exists idx_focus_forest_completed_user on focus_forest_completed(user_id);
create index if not exists idx_focus_forest_sessions_user on focus_forest_sessions(user_id);

-- RLS
alter table focus_forest_data enable row level security;
alter table focus_forest_completed enable row level security;

-- 자신의 데이터만 읽기/쓰기
create policy "Users can read own focus forest data"
  on focus_forest_data for select using (auth.uid() = user_id);

create policy "Users can insert own focus forest data"
  on focus_forest_data for insert with check (auth.uid() = user_id);

create policy "Users can update own focus forest data"
  on focus_forest_data for update using (auth.uid() = user_id);

create policy "Users can read own completed forests"
  on focus_forest_completed for select using (auth.uid() = user_id);

create policy "Users can insert own completed forests"
  on focus_forest_completed for insert with check (auth.uid() = user_id);

alter table focus_forest_sessions enable row level security;

create policy "Users can read own sessions"
  on focus_forest_sessions for select using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on focus_forest_sessions for insert with check (auth.uid() = user_id);
