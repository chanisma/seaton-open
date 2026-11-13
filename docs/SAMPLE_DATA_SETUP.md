# 샘플 데이터 설정 가이드

이 문서는 Seaton 프로젝트의 샘플 열람실 데이터를 설정하는 방법을 안내합니다.

## 📋 목차

1. [개요](#개요)
2. [데이터 구조](#데이터-구조)
3. [설정 방법](#설정-방법)
4. [데이터 확인](#데이터-확인)
5. [문제 해결](#문제-해결)

## 개요

Seaton 프로젝트는 **각 학년마다 정확히 하나의 열람실**을 제공합니다:

- **1학년 열람실**: 30석 (6행 × 5열) - 1학년 전용
- **2학년 열람실**: 35석 (7행 × 5열) - 2학년 전용
- **3학년 열람실**: 40석 (8행 × 5열) - 3학년 전용

⚠️ **중요**: `grade` 필드에 UNIQUE 제약조건이 있어, 각 학년(1, 2, 3)마다 하나의 열람실만 생성할 수 있습니다.

## 데이터 구조

### study_rooms 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| id | uuid | 고유 식별자 (자동 생성) |
| name | string | 열람실 이름 |
| grade | number | 학년 (1, 2, 3) |
| total_seats | number | 전체 좌석 수 |
| seat_layout | jsonb | 좌석 배치 정보 |
| is_active | boolean | 활성화 여부 |
| created_at | timestamp | 생성 시각 |

### seat_layout 구조

```json
{
  "rows": 6,           // 행 수
  "columns": 5,        // 열 수
  "emptySeats": []     // 빈 좌석 목록 (예: ["A3", "F5"])
}
```

### 좌석 번호 규칙

좌석 번호는 `행알파벳 + 열번호` 형식입니다:

- **행**: A, B, C, D, E, F, G, H... (위에서 아래로)
- **열**: 1, 2, 3, 4, 5... (왼쪽에서 오른쪽으로)

**예시**:
```
   1  2  3  4  5
A [A1][A2][A3][A4][A5]
B [B1][B2][B3][B4][B5]
C [C1][C2][C3][C4][C5]
```

## 설정 방법

### 방법 1: SQL 마이그레이션 실행 (권장)

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 좌측 메뉴에서 "SQL Editor" 클릭
   - "New Query" 버튼 클릭

3. **마이그레이션 실행**
   - `supabase/migrations/001_create_sample_study_rooms.sql` 파일 열기
   - 전체 내용 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭

4. **결과 확인**
   - 성공 메시지 확인
   - "3 rows affected" 표시 확인

### 방법 2: TypeScript 코드 실행

개발 환경에서 직접 실행:

```typescript
import { createSampleStudyRooms } from '@services/studyRoom.service';

// 컴포넌트 또는 초기화 함수에서
const setupSampleData = async () => {
  try {
    await createSampleStudyRooms();
    console.log('✅ 샘플 열람실 데이터 생성 완료');
  } catch (error) {
    console.error('❌ 샘플 데이터 생성 실패:', error);
  }
};
```

### 방법 3: Supabase CLI 사용

```bash
# 1. Supabase CLI 설치
npm install -g supabase

# 2. 프로젝트 연결
supabase link --project-ref your-project-ref

# 3. 마이그레이션 실행
supabase db push
```

## 데이터 확인

### Supabase Dashboard에서 확인

1. **Table Editor 열기**
   - 좌측 메뉴에서 "Table Editor" 클릭
   - "study_rooms" 테이블 선택

2. **데이터 확인**
   - 3개의 행이 표시되는지 확인
   - grade 1, 2, 3이 각각 있는지 확인

### SQL 쿼리로 확인

```sql
-- 모든 열람실 조회
SELECT
  name,
  grade,
  total_seats,
  seat_layout->>'rows' as rows,
  seat_layout->>'columns' as columns,
  is_active
FROM study_rooms
ORDER BY grade;
```

**예상 결과**:
```
name          | grade | total_seats | rows | columns | is_active
--------------+-------+-------------+------+---------+-----------
1학년 열람실  |     1 |          30 |    6 |       5 | true
2학년 열람실  |     2 |          35 |    7 |       5 | true
3학년 열람실  |     3 |          40 |    8 |       5 | true
```

### 애플리케이션에서 확인

```typescript
import { getAllStudyRooms } from '@services/studyRoom.service';

const checkStudyRooms = async () => {
  const rooms = await getAllStudyRooms();
  console.log('열람실 목록:', rooms);
  // 예상: 3개의 열람실 배열
};
```

## 커스터마이징

### 좌석 수 변경

```sql
-- 1학년 열람실을 8행 × 5열 (40석)로 변경
UPDATE study_rooms
SET
  total_seats = 40,
  seat_layout = jsonb_set(
    jsonb_set(seat_layout, '{rows}', '8'),
    '{columns}', '5'
  )
WHERE grade = 1;
```

### 빈 좌석 추가

특정 좌석을 비활성화하려면:

```sql
-- 1학년 열람실의 A3, A4, F5 좌석 비활성화
UPDATE study_rooms
SET seat_layout = jsonb_set(
  seat_layout,
  '{emptySeats}',
  '["A3", "A4", "F5"]'::jsonb
)
WHERE grade = 1;
```

### 열람실 추가

새로운 열람실 추가:

```sql
INSERT INTO study_rooms (
  id,
  name,
  grade,
  total_seats,
  seat_layout,
  is_active
) VALUES (
  gen_random_uuid(),
  '특별 열람실',
  1,  -- 1학년용
  20,
  '{
    "rows": 4,
    "columns": 5,
    "emptySeats": []
  }'::jsonb,
  true
);
```

## 문제 해결

### ❌ "relation study_rooms does not exist"

**원인**: study_rooms 테이블이 생성되지 않음

**해결책**:
1. CLAUDE.md의 데이터베이스 스키마 섹션 확인
2. study_rooms 테이블 생성 SQL 실행
3. 마이그레이션 다시 실행

### ❌ "duplicate key value violates unique constraint"

**원인**: 이미 데이터가 존재함

**해결책**:
```sql
-- 기존 데이터 삭제 후 다시 실행
DELETE FROM study_rooms WHERE name LIKE '%학년 열람실';
```

### ❌ TypeScript에서 "Cannot find module '@services/studyRoom.service'"

**원인**: 경로 별칭 설정 문제

**해결책**:
1. `vite.config.ts`에서 path aliases 확인
2. `tsconfig.json`에서 paths 설정 확인
3. 개발 서버 재시작

### ⚠️ 데이터는 있지만 화면에 표시되지 않음

**확인 사항**:
1. RLS (Row Level Security) 정책 확인
2. 사용자 권한 확인
3. `is_active` 필드가 `true`인지 확인

**RLS 정책 예시**:
```sql
-- 모든 인증된 사용자가 조회 가능하도록
CREATE POLICY "Anyone can view active study rooms"
ON study_rooms FOR SELECT
USING (is_active = true);
```

## 데이터 초기화

### 샘플 데이터만 삭제

```sql
DELETE FROM study_rooms
WHERE name IN ('1학년 열람실', '2학년 열람실', '3학년 열람실');
```

### 모든 열람실 데이터 삭제

```sql
TRUNCATE TABLE study_rooms CASCADE;
```

⚠️ **주의**: `CASCADE` 옵션은 관련된 모든 예약 데이터도 함께 삭제합니다.

## 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL JSONB 문서](https://www.postgresql.org/docs/current/datatype-json.html)
- 프로젝트 `CLAUDE.md` 파일
- `supabase/README.md` 파일

## 문의

문제가 지속되면 프로젝트 이슈를 생성하거나 담당자에게 문의하세요.

---

**마지막 업데이트**: 2025-01-03
