# Seaton - 학교 열람실 자리 신청 시스템

> **최종 업데이트**: 2026-10-09 (공유 DB 계약 · 통합 지갑 · 좌석 읽기 RPC)
> **현재 단계**: 프로덕션 운영 중

## 프로젝트 개요

**Seaton**은 학생들이 학교 열람실(자습 공간) 자리를 주 단위로 신청하고, 교사가 출석을 관리하는 웹 애플리케이션입니다.

- 구글 로그인 인증 (@myschool.hs.kr 도메인 제한)
- 시각적 자리 배치도를 통한 직관적인 자리 선택
- 다중 교시(period) 예약 지원
- 교사용 출석 체크 및 통계 기능
- 관리자 시스템 (열람실/예약/퍼즐 관리)
- 배지, 퍼즐, 코인(통합 지갑), 온도 랭킹 등 게이미피케이션 요소
  - ~~포인트~~ → 2026-10-09 부터 새 보상은 **코인**. 기존 포인트는 «이전 포인트(퍼즐 전용)»로 동결 — 아래 «공유 DB 계약» 참고

## 기술 스택

### Frontend
- **Framework**: React 18+ with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS (다크 모드 지원)
- **State**: Zustand (auth) + React Context (StudyRoomContext)
- **Routing**: React Router v7
- **Charts**: Recharts
- **Icons**: lucide-react
- **Excel**: xlsx
- **Dates**: date-fns

### Backend & Database
- **BaaS**: Supabase (PostgreSQL + Auth + Realtime)
- **Authentication**: Google OAuth via Supabase Auth

## 빌드 & 스크립트

```bash
npm run dev          # 개발 서버
npm run build        # tsc -b && vite build
npm run lint:fix     # ESLint 자동 수정
npm run format       # Prettier 포맷팅
npm run type-check   # tsc --noEmit
```

## 프로젝트 구조

```
seaton/
├── src/
│   ├── components/
│   │   ├── admin/           # AdminLayout, AdminRoute, SeatLayoutEditor, AdminReservationModal
│   │   ├── auth/            # ProtectedRoute
│   │   ├── common/          # Button, Input, Select, Modal, Toast, Layout, Navigation, Footer, Skeleton, LoadingSpinner
│   │   ├── reservation/     # SeatMap (공용 좌석 배치도)
│   │   ├── student/         # Seat, DateSelector, ReservationCalendar
│   │   └── teacher/         # AttendanceSeat
│   ├── contexts/
│   │   └── StudyRoomContext.tsx  # 열람실 데이터 공유 Context
│   ├── hooks/               # useAuth, useToast, useReservation
│   ├── lib/                 # supabase.ts (클라이언트)
│   ├── pages/
│   │   ├── admin/           # RoomManagement, RoomEditor, ReservationManagementPage, PuzzleManagementPage
│   │   ├── Login.tsx, AuthCallback.tsx
│   │   ├── StudentDashboard.tsx, TeacherDashboard.tsx
│   │   ├── ReservationPage.tsx, MyReservationsPage.tsx
│   │   ├── AttendanceCheckPage.tsx, DailyAttendancePage.tsx
│   │   ├── StatisticsDashboardPage.tsx, StudentStatisticsPage.tsx, RoomStatisticsPage.tsx
│   │   ├── BadgePage.tsx, PuzzlePage.tsx, TemperatureRankingPage.tsx
│   │   └── NotFound.tsx
│   ├── services/            # auth, reservation, statistics, studyRoom, badge, points, puzzle
│   ├── store/               # authStore.ts (Zustand)
│   ├── types/               # user.types, reservation.types, supabase.types
│   └── utils/               # constants, dateHelpers, resourceEnrichment, validation
├── supabase/migrations/     # SQL 마이그레이션 파일
└── docs/                    # SAMPLE_DATA_SETUP, SEAT_LAYOUT_GUIDE
```

## 데이터베이스 스키마

### 기존 테이블 (읽기 전용)

#### resource
```sql
resource {
  id: uuid (primary key)
  type: text     -- 'student' | 'teacher' | 'staff' | 'room' | 'device' | 'group'
                 -- | 'classroom' | 'iframe' | 'link' | 'graduated' | 'inactive'
  name: text     -- 실명 (학생 이름은 여기에만 있음)
  status: text   -- 'active' | 'graduated' | 'transferred' | 'withdrawn'
  meta: jsonb
  created_at, updated_at: timestamptz
}
```
> ⚠️ **`email` 컬럼이 없습니다.** 이메일 매칭 방식이 type별로 다릅니다:
> - **학생**: `meta`에 email이 없음 -> `meta.id`(학번)로 조합 `{meta.id}@myschool.hs.kr`
> - **교사/직원**: `meta.email`에 전체 이메일이 들어 있음 (`meta.accounts.google.id`도 존재)
>
> 이 분기를 감싼 헬퍼가 `public.resolve_profile_name(email)` 입니다.

`meta` 주요 키 (학생 기준):

| 키 | 예시 | 설명 |
|---|---|---|
| `id` | `"00-00597"` | 학번 — **`studentId`가 아님** |
| `grade` | `2` | 학년 |
| `class` | `4` | 반 |
| `number` | `19` | 반 내 번호 |
| `snum1`, `snum2` | `"10719"`, `"20419"` | 내부 학적번호 |
| `picture` | URL | 프로필 사진 |
| `birthday`, `major`, `career` | | 생일 / 계열 / 희망진로 |
| `timetable` | `[{ period, subject, day_of_week, teacher_name }]` | 주간 시간표 |

CHECK 제약 (개인정보 보호):
- `resource_meta_no_personal_phone`: `meta`에 `phone` / `hp` 키 저장 금지
- `resource_graduated_student_privacy`: `status='graduated'`인 학생은 `name`이 `YYYY입학NNN` 형식이어야 하고 `meta`에 `grade`/`picture`/`birthday` 금지

#### profiles
```sql
profiles {
  id: uuid (primary key, references auth.users.id ON DELETE CASCADE)
  email: text
  role: text  -- 'student' | 'teacher' | 'admin' | 'staff'
  name: text  -- NULL 가능 (로그인 시 resource.name으로 지연 채움)
  nickname, signature, stamp: text
  selected_badge_id: int (ref seaton_badge.id ON DELETE SET NULL)
  visit_count, ranking_points: int
  problems_registered, solutions_registered, total_likes_received: int
  is_first_login: boolean
  last_login, created_at, updated_at: timestamptz
  -- grade/class/student_number는 DB 컬럼이 아님 -> resource.meta에서 enrichment로 병합
}
```
> `profiles.name`은 NULL이 될 수 있습니다. `enrichWithResourceMeta()`가 `resource.name`으로 폴백하므로
> 예약 조회는 이 함수를 거치게 하세요. (2026-08-24: 학생 36명의 name이 NULL이어서 30명 백필,
> 나머지 6명은 `resource` 행 자체가 없음)

### 테이블 관계 및 핵심 패턴

- `profiles`와 `resource`는 외래키 관계 없음. **`resource`에 email 컬럼이 없으므로** 매칭은 항상 학번을 경유합니다:
  - `profiles.email` -> `split('@')[0]` = 학번 -> `resource.meta->>'id'`
  - 역방향: `resource.meta->>'id'` + `'@myschool.hs.kr'` -> `profiles.email`
- **resource.meta enrichment 패턴** (`src/utils/resourceEnrichment.ts`):
  1. 조회 시 `profiles(id, email, name)`만 JOIN
  2. `enrichWithResourceMeta()`가 이메일에서 학번을 추출해 `.in('meta->>id', ...)`로 일괄 조회
  3. `grade`, `class`, `student_number`(=`meta.id`), `number`를 런타임 병합
- **역할 결정**: resource 매칭이 아니라 **이메일 형식 정규식**으로 판정합니다
  - `isStudentEmail()` = `/^\d{2}-\d{5}@myschool\.hs\.kr$/` -> 통과하면 student, 아니면 teacher
  - 이미 프로필이 있으면 `profiles.role`을 우선 사용 (`admin`/`staff` 포함)
- `seat_reservations.student_id`는 **profiles.id** 참조 (resource.id 아님)
- **학년 필터**: `getStudentIdsByGrade()` -> resource.meta.grade 기반 profiles.id 목록

### 신규 테이블

#### study_rooms
```sql
study_rooms {
  id: uuid, name: text
  grade: int (CHECK 1|2|3, UNIQUE 아님)
  grades: int[]              -- 다중 학년 공용 열람실
  total_seats: int (CHECK > 0), seat_layout: jsonb, rules: text
  is_active: boolean, is_sungong: boolean

  -- 예약 기간
  reservation_mode: text     -- 'WEEKLY' | 'FIXED'
  fixed_start_date, fixed_end_date: date
  booking_start_date, booking_end_date: timestamptz
  booking_windows: jsonb     -- 예약 오픈 창 목록

  -- 운영 요일 / 교시
  operating_days: int[] (default '{1,2,3,4,5}')
  is_saturday_open, is_sunday_open: boolean
  use_periods: boolean
  operating_periods: jsonb   -- [{ id, name, start_time, end_time }]
  period_booking_mode: text  -- default 'ALL_AT_ONCE'
  day_period_mode: text      -- default 'UNIFORM'
  allow_duplicate_reservation: boolean

  created_at, updated_at: timestamptz
}
```
> `grade`의 UNIQUE 제약은 제거되었습니다 (`20251204_remove_unique_grade_constraint.sql`). 같은 학년에 열람실이 여러 개 존재하며, 비활성(`is_active=false`) 열람실도 남아 있으므로 조회 시 필터가 필요합니다.

#### seat_reservations
```sql
seat_reservations {
  id: uuid
  student_id: uuid (ref profiles.id ON DELETE CASCADE)
  room_id: uuid (ref study_rooms.id ON DELETE CASCADE)
  seat_number: text, reservation_date: date, period_id: int
  is_attended: boolean, attendance_status: text
  attended_at: timestamptz, checked_by: uuid (ref profiles.id)
  feedback_rating: smallint (CHECK 1~5), feedback_note: text, feedback_at: timestamptz
  created_at: timestamptz

  UNIQUE(student_id, room_id, reservation_date, period_id)   -- unique_student_reservation
  UNIQUE(room_id, seat_number, reservation_date, period_id)  -- unique_seat_reservation
}
```
> 다중 교시(`period_id`) 지원이 추가되면서 두 UNIQUE 제약 모두에 `period_id`가, 학생 제약에는 `room_id`가 포함되었습니다. 따라서 한 학생이 하루에 열람실·교시별로 여러 건 예약할 수 있습니다.
> 출석 컬럼(`is_attended`, `attendance_status`, `attended_at`, `checked_by`)은 `trg_protect_attendance_columns` 트리거가 학생의 자가 조작을 차단합니다 (`20260705_security_hardening_rls.sql`).
>
> **`period_id` 규약**: `0` = 종일(all-day). 열람실이 `use_periods=false`(또는 `operating_periods`가 비어 있음)이면 하루 1건, `period_id=0`만 존재해야 합니다.
> 예전에는 `createReservation()`이 호출부가 넘긴 교시를 열람실 설정과 대조하지 않아, 직전에 고른 교시 열람실의 `selectedPeriodIds`가 UI에 남은 채 아침 열람실을 신청하면
> 교시 1·2 행이 하루 2건씩 생성됐습니다. 현재는 서비스 레이어에서 열람실 기준으로 클램프하고 `ReservationPage`가 열람실 변경 시 선택 상태를 초기화합니다.
> 기존 잘못된 행 218건(6명)은 `20260901_fix_period_id_on_non_period_rooms.sql` + `20260901_fix_period_id_dual_attended_groups.sql`로 정리했습니다.
> 그룹(학생·열람실·날짜)당 1건만 남기고 `period_id=0`으로 정규화, 중복 83건 삭제. 남긴 행은 출결 기록이 있는 쪽(양쪽 다 있으면 먼저 체크된 쪽)이라 출결은 소실되지 않았습니다.
> 원본 218건은 `seat_reservations_period_fix_backup_20260901` 테이블에 백업되어 있습니다.

#### reservation_settings
```sql
reservation_settings {
  id: uuid, reservation_open_day: number (default 0=일요일),
  reservation_open_time: time (default '20:00'),
  max_days_ahead: number (default 5), terms_and_conditions: text,
  updated_at: timestamp
}
```

### 프로필 자동 생성/복구 트리거

`auth.users`에 걸린 트리거가 `public.profiles`를 관리합니다.

| 트리거 | 시점 | 함수 | 역할 |
|---|---|---|---|
| `on_auth_user_created` | AFTER INSERT | `handle_existing_user_profile()` | 이메일 형식으로 role 판정 후 프로필 생성 (`nickname`, `name` 포함) |
| `on_auth_user_login` | AFTER UPDATE OF `last_sign_in_at` | `update_last_login()` | `last_login` 갱신 + `name`이 비어 있으면 자가 복구 |
| `tr_check_email_blocklist` | | `check_email_blocklist()` | 차단 이메일 거부 |

`public.profiles` 자체 트리거: `enforce_kijun_domain_trigger`(도메인 검증), `trg_protect_profile_role`(role 자가 변경 차단 — role이 그대로면 통과).

> 두 프로필 트리거 모두 `resolve_profile_name()`을 사용해 `name`을 채웁니다 (`20260824_fix_profile_name_autofill.sql`).
> 앱(`auth.service.ts`)의 백필도 **반드시 await** 해야 합니다 — 예전에 fire-and-forget이라 유실됐습니다.

### RLS 참고 (DB 직접 조회 시)

`study_rooms`, `seat_reservations`, `profiles`는 RLS가 걸려 있어 **anon 키로는 빈 배열**만 돌아옵니다.
조회 권한은 로그인한 학생 본인 또는 교사 계정에만 있습니다
(`20250104_update_seat_reservations_use_profiles.sql`). `resource`는 anon에게 아예 `permission denied`입니다.
개발 중 데이터 확인이 필요하면 Supabase MCP / service_role 키를 사용하세요.
> ⚠️ 2026-10-01 실측: 라이브 DB의 `seat_reservations`에는 `Authenticated users can read all reservations`(`USING true`) 정책이 있어
> 로그인한 사용자는 누구나 전체 예약을 조회할 수 있습니다(위 설명은 마이그레이션 파일 기준).
> **→ 2026-10-09 결정: 이 정책은 없앤다** (이 클라이언트가 배포된 뒤 spacekijun 쪽 별도 마이그레이션). 그 뒤 학생은 **자기 예약 행만** 읽는다.
> 학생 화면에서 남의 예약이 필요하면 직접 읽지 말고 좌석 RPC(`seaton_seat_occupancy`·`seaton_room_seat_counts`)를 쓸 것 — 아래 «공유 DB 계약».

### 통계 서버 집계 RPC (`20261001_statistics_bundle_rpcs.sql`)

| RPC | 용도 | 폴백 |
|---|---|---|
| `get_student_stats_bundle` | 학생별 통계 + 일별 출석 (학생 탭, 열람실 요약 카드, DailyAttendancePage) | 예약 원본 페이징 + 클라이언트 집계 |
| `get_weekday_crosstab` | 요일별 교차표 | 동일 |

- `statistics.service.ts`가 RPC를 먼저 호출하고, 함수가 없거나 실패하면 기존 클라이언트 집계로 폴백합니다.
- 판정 기준(오늘·23시 마감·온도 증감 상수)은 클라이언트가 인자로 넘깁니다. **집계 규칙을 바꾸면 SQL과 `aggregateStatsBundle()` 둘 다 수정**해야 합니다.
- `get_student_stats_bundle`은 plpgsql 동적 SQL입니다. `LANGUAGE sql`로 되돌리면 일반 계획 때문에 학기 범위가 7초 이상 걸립니다.
- 두 함수 모두 SECURITY INVOKER(RLS 적용), `authenticated`만 실행 가능.

### 월별 온도 랭킹 RPC (`20261008_add_monthly_temperature_ranking.sql`)

- `get_monthly_temperature_ranking(p_month date)`: 해당 월의 온도 변화량 기준 순위 (`TemperatureRankingPage`의 "월별" 탭). MV 없이 매번 계산.
- 점수 규칙은 `temperature_rankings_mv.monthly_change`와 동일합니다. **온도 규칙을 바꾸면 MV와 이 함수를 함께 수정**하세요.

## 공유 DB 계약 (2026-10-09)

seaton 은 spacekijun 과 **같은 Supabase DB** 를 쓴다. 두 앱이 함께 기대는 SQL
(통계 계약 `seaton_stats_*` · 통합 지갑 · 좌석 읽기 RPC · 피드백 가드 · 집중의 숲 서버 시각)의 **정본은 spacekijun 저장소**다.

- 마이그레이션 = `spacekijun/supabase/migrations/20261009*`
  (`20261009100000_seaton_stats_contract.sql`, `20261009110000_seaton_read_rpcs_and_delete_guard.sql`,
  `20261009120000_unified_wallet_seaton_cutover.sql`, 그리고 이 클라이언트 배포 뒤 적용할 `20261009130000_seat_reservations_select_narrow.sql` = `USING true` 정책 제거)
- **DB 를 바꿀 일이 있으면 spacekijun 저장소에서** 한다. 이 저장소의 `supabase/migrations/` 에 같은 대상을 새로 쓰지 말 것(두 벌이 되면 한쪽만 고쳐진다).
- 상세 문서(spacekijun): `docs/features/unified-wallet.md` · `docs/database/seaton-contract.md`

### 좌석 읽기 RPC (학생 화면)

| RPC | 반환 | 쓰는 곳 |
|---|---|---|
| `seaton_seat_occupancy(p_room, p_start, p_end, p_seat?)` | `{seat_number, reservation_date, period_id, is_mine}` 행 | 좌석 지도(WEEKLY 하루 · FIXED 기간), 신청·이동 전 자리 확인 |
| `seaton_room_seat_counts(p_start, p_end)` | `{room_id, unique_seats}` 행 | 학생 신청 화면의 열람실별 사용 좌석 수 (`getRoomSeatCounts`) |

- 학생 id·이름을 돌려주지 않는다. 내 것인지만 `is_mine`. **1000행 제한이 RPC 에도 걸린다** → `.range()` 페이징(`fetchSeatOccupancy`).
- 좌석 지도 = 남의 점유(`is_mine=false`) + 내 예약(`myReservations`)을 합친 것(`mergeRoomSlots`). 취소·이동 직후 화면은 내 예약을 id 로 고친다.
- **종일(0) ↔ 교시 충돌은 DB 유니크 키가 못 잡는다** → 클라이언트가 `findSeatConflict`(`src/utils/seatOccupancy.ts`)로 확인. 신청·이동이 23505(`unique_seat_reservation`)로 실패하면 «방금 다른 학생이 이 자리를 신청했습니다» 안내 + 좌석 지도 다시 읽기.
- 교사 화면(출석 체크·통계·순공·관리)은 종전대로 예약 행을 직접 읽는다(`getRoomReservationCounts` 등). 교사 RLS 는 바뀌지 않는다.
- 학생 예약 삭제는 «본인 · 오늘(KST) 이후 · 출석 처리 전»만(서버 정책).

### 통합 지갑 — 포인트 동결 · 코인

- **코인** = 아카데미·다마고찌와 같은 지갑(`academy_user_stats.coins`). 새 보상은 전부 코인이다.
- **이전 포인트**(`point_transactions` 합계) = 더 쌓이지 않는다(서버 트리거가 적립을 거부). **퍼즐 전용**.
- 보상 규칙 (전부 서버가 지급 — 클라이언트는 지급 RPC 를 부르지 않는다)
  - 자습실 출석 확인 → **+5코인** (교사가 출석 처리하면 트리거가 자동 지급, 출석 취소 시 회수). 보상은 `attendance_status` 를 본다 → 출석을 쓰는 경로는 `is_attended`·`attendance_status`·`attended_at`·`checked_by` 를 함께 쓸 것(CSV 가져오기 `bulkUpdateAttendance` 포함)
  - 피드백(자기 평가) → **+1코인** — 출석한 예약에만 · 이용일부터 7일 안 · 하루 1번 · 지울 수 없음. 위반은 서버 가드가 42501 + 한국어 메시지로 거절 → 화면에 그대로 보여 준다
  - 집중의 숲 → **+2코인** — 25/50/90분 목표 세션을 서버가 잰 것만(`seaton_focus_start` → 목표 시각 ~ +15분 안에 `seaton_focus_finish`). **다마고찌 «함께 집중»과 합쳐 하루 2번**. 무제한 모드는 코인 없음. 학생만.
  - 퍼즐 조각 → 이전 포인트를 먼저 쓰고, 모자란 만큼 **2P = 1코인(올림)**. 교사·관리자는 무료.

| RPC | 용도 |
|---|---|
| `seaton_wallet_read()` | `{coins, legacy_points, review_left, focus_left, recent[], server_now}` — `getWallet()` |
| `academy_study_read(p_week, p_student_code)` | **이번 주 출석 코인**(학생 대시보드 카드, 2026-10-15) — 예약마다 출석 상태·받았나 + `claimed_coins`. 별빛 아카데미 자습 기록과 **같은 RPC**(영수증 `academy_study_rewards`). 상태 나누기 = `utils/studyRewards.ts`(하루 최대 2회 판정이 서버와 같은 예약 id 순서) — `getStudyWeek()` |
| `seaton_puzzle_quote(p_event_id)` | 조각 하나에 낼 것 `{pay_points, pay_coins, affordable, free, …}` — `getPuzzleQuote()` |
| `unlock_puzzle_piece(p_event_id, p_piece_index)` | 이름·반환 그대로. `remaining_points` = 남은 **이전 포인트** |
| `seaton_focus_start(p_minutes)` / `seaton_focus_finish(p_id, p_give_up?)` | 집중 코인 (`startFocusRun` / `finishFocusRun`). finish 가 `'running'` 이면 남은 초 — 실패가 아니다 |
| `get_student_points(p_student_id)` | 그대로 (이전 포인트만) |
| ~~`award_focus_points`~~ | 항상 0 — **부르지 않는다** |

순수 규칙(견적 추정·문구·이력 합치기)은 `src/utils/wallet.ts`. 서버 식과 같아야 한다.

## 인증 플로우

1. Google OAuth 로그인 (@myschool.hs.kr 도메인 제한, `hd: 'myschool.hs.kr'`)
2. `AuthCallback.tsx`에서 콜백 처리
3. profiles 테이블 조회 -> 있으면 기존 사용자, 없으면 신규 생성
4. 이메일 형식으로 역할 결정 (`/^\d{2}-\d{5}@myschool\.hs\.kr$/` -> student, 그 외 -> teacher).
   기존 프로필이 있으면 `profiles.role`을 우선 사용 (`admin`/`staff` 포함)
5. 학생이면 `email.split('@')[0]`(학번)으로 `resource.meta->>'id'` 조회 -> 이름/학년/반/번호 확보
   (`profiles.name`이 비어 있으면 `resource.name`으로 백그라운드 업데이트)
6. User 객체를 Zustand authStore에 저장

## 주요 아키텍처 결정

- **SeatMap 공용화**: `src/components/reservation/SeatMap.tsx` (학생/교사 공용)
- **StudyRoomContext**: 열람실 데이터를 Context로 공유 (operating periods 포함)
- **코드 스플리팅**: 모든 페이지 React.lazy + Suspense
- **스켈레톤 로딩**: Card, Table, StatCard, SeatMap, Chart 별 Skeleton 컴포넌트
- **관리자 라우팅**: AdminRoute + AdminLayout으로 분리
- **Excel 내보내기**: xlsx 라이브러리 사용 (CSV도 지원)

## 환경 변수

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Path Aliases

`@/`, `@components/`, `@hooks/`, `@services/`, `@types/`, `@utils/`, `@pages/`, `@assets/`

## 커밋 규칙

`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
