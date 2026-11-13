# Supabase 설정 가이드

## 📂 폴더 구조

```
supabase/
├── migrations/
│   ├── 20250104_update_profiles_add_student_info.sql  # profiles에 학생 정보 추가
│   ├── 20250104_update_seat_reservations_use_profiles.sql  # seat_reservations 외래키 변경
│   └── (기타 마이그레이션 파일들)
└── README.md
```

## 🚀 마이그레이션 실행

**실행 순서 (중요)**:
1. `20250104_update_profiles_add_student_info.sql` (profiles 테이블 수정)
2. `20250104_update_seat_reservations_use_profiles.sql` (seat_reservations 재생성)

### 방법 1: Supabase Dashboard 사용

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **SQL Editor** 메뉴 클릭
4. **New Query** 버튼 클릭
5. `migrations/001_create_sample_study_rooms.sql` 파일 내용 복사/붙여넣기
6. **Run** 버튼 클릭

### 방법 2: Supabase CLI 사용

```bash
# Supabase CLI 설치 (아직 설치하지 않은 경우)
npm install -g supabase

# Supabase 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 실행
supabase db push
```

### 방법 3: 프로그래밍 방식 (개발/테스트용)

TypeScript 코드에서 직접 실행:

```typescript
import { createSampleStudyRooms } from '@services/studyRoom.service';

// 샘플 열람실 생성
await createSampleStudyRooms();
```

## 📊 생성되는 데이터

⚠️ **중요**: 각 학년마다 정확히 하나의 열람실만 생성됩니다. `grade` 필드에 UNIQUE 제약조건이 적용되어 있습니다.

### 1학년 열람실
- 이름: 1학년 열람실
- 학년: 1 (UNIQUE)
- 좌석 수: 30석 (6행 × 5열)
- 상태: 활성

### 2학년 열람실
- 이름: 2학년 열람실
- 학년: 2 (UNIQUE)
- 좌석 수: 35석 (7행 × 5열)
- 상태: 활성

### 3학년 열람실
- 이름: 3학년 열람실
- 학년: 3 (UNIQUE)
- 좌석 수: 40석 (8행 × 5열)
- 상태: 활성

## ⚠️ 주의사항

1. **중복 실행 방지**: 마이그레이션을 여러 번 실행하면 중복 데이터가 생성될 수 있습니다.
2. **프로덕션 환경**: 프로덕션 환경에서는 신중하게 실행하세요.
3. **백업**: 중요한 데이터가 있는 경우 백업 후 실행하세요.

## 🔧 커스터마이징

좌석 배치를 수정하려면 `seat_layout` JSONB 필드를 변경하세요:

```sql
-- 예시: 빈 좌석 추가
'{
  "rows": 6,
  "columns": 5,
  "emptySeats": ["A3", "A4", "F1", "F5"]
}'::jsonb
```

좌석 번호 형식: `행알파벳 + 열번호` (예: A1, B3, F5)
- 행: A, B, C, D, E, F, G, H...
- 열: 1, 2, 3, 4, 5...

## 📝 데이터 확인

마이그레이션 실행 후 데이터 확인:

```sql
SELECT * FROM study_rooms ORDER BY grade;
```

## 🗑️ 데이터 초기화

테스트 데이터를 삭제하려면:

```sql
DELETE FROM study_rooms WHERE name LIKE '%학년 열람실';
```

또는 모든 열람실 삭제:

```sql
TRUNCATE TABLE study_rooms CASCADE;
```
