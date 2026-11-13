# 좌석 배치 가이드

좌석 배치 시스템의 구조와 사용 방법을 설명합니다.

## 📐 좌석 배치 구조

### SeatLayout 타입

```typescript
interface SeatLayout {
  rows: number;           // 행 수 (1-26, A-Z)
  columns: number;        // 열 수 (1-99)
  emptySeats?: string[];  // 빈 좌석 목록 (선택적)
}
```

### 좌석 번호 생성 규칙

좌석 번호는 `행알파벳 + 열번호` 형식으로 자동 생성됩니다:

```
행: String.fromCharCode(65 + rowIndex)  // 65 = 'A'
열: columnIndex + 1

좌석번호 = `${행}${열}`
```

**예시**:
- 첫 번째 행, 첫 번째 열: `A1`
- 두 번째 행, 세 번째 열: `B3`
- 여섯 번째 행, 다섯 번째 열: `F5`

## 📊 레이아웃 예시

### 소형 열람실 (20석)

```typescript
{
  rows: 4,
  columns: 5,
  emptySeats: []
}
```

**시각화**:
```
   1  2  3  4  5
A [A1][A2][A3][A4][A5]
B [B1][B2][B3][B4][B5]
C [C1][C2][C3][C4][C5]
D [D1][D2][D3][D4][D5]
```

### 중형 열람실 (30석)

```typescript
{
  rows: 6,
  columns: 5,
  emptySeats: []
}
```

**시각화**:
```
   1  2  3  4  5
A [A1][A2][A3][A4][A5]
B [B1][B2][B3][B4][B5]
C [C1][C2][C3][C4][C5]
D [D1][D2][D3][D4][D5]
E [E1][E2][E3][E4][E5]
F [F1][F2][F3][F4][F5]
```

### 대형 열람실 (40석)

```typescript
{
  rows: 8,
  columns: 5,
  emptySeats: []
}
```

**시각화**:
```
   1  2  3  4  5
A [A1][A2][A3][A4][A5]
B [B1][B2][B3][B4][B5]
C [C1][C2][C3][C4][C5]
D [D1][D2][D3][D4][D5]
E [E1][E2][E3][E4][E5]
F [F1][F2][F3][F4][F5]
G [G1][G2][G3][G4][G5]
H [H1][H2][H3][H4][H5]
```

## 🎯 복잡한 레이아웃

### 통로가 있는 레이아웃

가운데 통로를 만들려면 `emptySeats` 사용:

```typescript
{
  rows: 6,
  columns: 7,
  emptySeats: ["A4", "B4", "C4", "D4", "E4", "F4"]
}
```

**시각화**:
```
   1  2  3    4    5  6  7
A [A1][A2][A3]     [A5][A6][A7]
B [B1][B2][B3]     [B5][B6][B7]
C [C1][C2][C3]     [C5][C6][C7]
D [D1][D2][D3]     [D5][D6][D7]
E [E1][E2][E3]     [E5][E6][E7]
F [F1][F2][F3]     [F5][F6][F7]
```

### 비대칭 레이아웃

특정 위치의 좌석 제거:

```typescript
{
  rows: 5,
  columns: 6,
  emptySeats: ["A1", "A6", "E1", "E6"]
}
```

**시각화**:
```
   1     2  3  4  5     6
A      [A2][A3][A4][A5]
B [B1][B2][B3][B4][B5][B6]
C [C1][C2][C3][C4][C5][C6]
D [D1][D2][D3][D4][D5][D6]
E      [E2][E3][E4][E5]
```

### 특수 구역 레이아웃

앞쪽 빈 공간 (교탁/칠판):

```typescript
{
  rows: 7,
  columns: 5,
  emptySeats: ["A1", "A2", "A3", "A4", "A5"]
}
```

**시각화**:
```
   1     2     3     4     5
A                              ← 앞쪽 (빈 공간)
B [B1][B2][B3][B4][B5]
C [C1][C2][C3][C4][C5]
D [D1][D2][D3][D4][D5]
E [E1][E2][E3][E4][E5]
F [F1][F2][F3][F4][F5]
G [G1][G2][G3][G4][G5]
```

## 💻 프로그래밍 방식 생성

### 단순 레이아웃 생성

```typescript
const createSimpleLayout = (rows: number, columns: number): SeatLayout => {
  return {
    rows,
    columns,
    emptySeats: []
  };
};

// 사용 예시
const layout = createSimpleLayout(6, 5);  // 30석
```

### 통로가 있는 레이아웃 생성

```typescript
const createLayoutWithAisle = (
  rows: number,
  columns: number,
  aisleColumn: number
): SeatLayout => {
  const emptySeats: string[] = [];

  for (let row = 0; row < rows; row++) {
    const rowLetter = String.fromCharCode(65 + row);
    emptySeats.push(`${rowLetter}${aisleColumn}`);
  }

  return {
    rows,
    columns,
    emptySeats
  };
};

// 사용 예시: 4번째 열을 통로로
const layout = createLayoutWithAisle(6, 7, 4);
```

### 특정 좌석 제외

```typescript
const createLayoutWithExclusions = (
  rows: number,
  columns: number,
  excludeSeats: string[]
): SeatLayout => {
  return {
    rows,
    columns,
    emptySeats: excludeSeats
  };
};

// 사용 예시
const layout = createLayoutWithExclusions(5, 6, ["A1", "A6", "E1", "E6"]);
```

### 패턴 기반 레이아웃

```typescript
const createCheckerboardLayout = (
  rows: number,
  columns: number
): SeatLayout => {
  const emptySeats: string[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      // 체크보드 패턴: (행 + 열)이 짝수인 경우 제외
      if ((row + col) % 2 === 0) {
        const rowLetter = String.fromCharCode(65 + row);
        const colNumber = col + 1;
        emptySeats.push(`${rowLetter}${colNumber}`);
      }
    }
  }

  return {
    rows,
    columns,
    emptySeats
  };
};
```

## 🔧 유틸리티 함수

### 좌석 번호 생성

```typescript
const getSeatNumber = (row: number, column: number): string => {
  const rowLetter = String.fromCharCode(65 + row);
  const colNumber = column + 1;
  return `${rowLetter}${colNumber}`;
};
```

### 좌석 번호 파싱

```typescript
const parseSeatNumber = (seatNumber: string): { row: number; column: number } => {
  const rowLetter = seatNumber.charAt(0);
  const colNumber = parseInt(seatNumber.slice(1), 10);

  return {
    row: rowLetter.charCodeAt(0) - 65,  // 'A' = 0, 'B' = 1, ...
    column: colNumber - 1                // 1 = 0, 2 = 1, ...
  };
};
```

### 좌석 유효성 검증

```typescript
const isValidSeat = (
  seatNumber: string,
  layout: SeatLayout
): boolean => {
  const { row, column } = parseSeatNumber(seatNumber);

  // 범위 체크
  if (row < 0 || row >= layout.rows) return false;
  if (column < 0 || column >= layout.columns) return false;

  // 빈 좌석 체크
  if (layout.emptySeats?.includes(seatNumber)) return false;

  return true;
};
```

### 전체 좌석 수 계산

```typescript
const getTotalSeats = (layout: SeatLayout): number => {
  const totalPossible = layout.rows * layout.columns;
  const emptyCount = layout.emptySeats?.length || 0;
  return totalPossible - emptyCount;
};
```

### 모든 유효 좌석 목록 생성

```typescript
const getAllValidSeats = (layout: SeatLayout): string[] => {
  const seats: string[] = [];

  for (let row = 0; row < layout.rows; row++) {
    for (let col = 0; col < layout.columns; col++) {
      const seatNumber = getSeatNumber(row, col);
      if (!layout.emptySeats?.includes(seatNumber)) {
        seats.push(seatNumber);
      }
    }
  }

  return seats;
};
```

## 📝 SQL에서 사용

### 레이아웃 저장

```sql
INSERT INTO study_rooms (name, grade, total_seats, seat_layout)
VALUES (
  '테스트 열람실',
  1,
  27,  -- 30 - 3 (emptySeats)
  '{
    "rows": 6,
    "columns": 5,
    "emptySeats": ["A3", "C3", "E3"]
  }'::jsonb
);
```

### 레이아웃 수정

```sql
-- 행/열 수 변경
UPDATE study_rooms
SET seat_layout = jsonb_set(
  jsonb_set(seat_layout, '{rows}', '8'),
  '{columns}', '6'
)
WHERE id = 'room-uuid';

-- 빈 좌석 추가
UPDATE study_rooms
SET seat_layout = jsonb_set(
  seat_layout,
  '{emptySeats}',
  (seat_layout->'emptySeats') || '["F6"]'::jsonb
)
WHERE id = 'room-uuid';
```

### 레이아웃 조회

```sql
SELECT
  name,
  seat_layout->>'rows' as rows,
  seat_layout->>'columns' as columns,
  jsonb_array_length(seat_layout->'emptySeats') as empty_count
FROM study_rooms;
```

## 🎨 UI 렌더링

### SeatMap 컴포넌트에서 사용

```typescript
// src/components/student/SeatMap.tsx
const seatGrid = useMemo(() => {
  return Array.from({ length: layout.rows * layout.columns }).map((_, index) => {
    const row = Math.floor(index / layout.columns);
    const col = index % layout.columns;
    const seatNumber = `${String.fromCharCode(65 + row)}${col + 1}`;

    // 빈 좌석 체크
    const isEmpty = layout.emptySeats?.includes(seatNumber) || false;

    if (isEmpty) {
      return { key: seatNumber, isEmpty: true };
    }

    return {
      key: seatNumber,
      isEmpty: false,
      seatNumber,
      isOccupied: occupiedSeats.has(seatNumber),
      isSelected: selectedSeat === seatNumber,
      isMine: mySeat === seatNumber,
    };
  });
}, [layout, occupiedSeats, selectedSeat, mySeat]);
```

## ⚠️ 제약사항

### 최대값

- **행 수**: 최대 26행 (A-Z)
- **열 수**: 이론적 제한 없음, 실용적으로는 ~20열 권장
- **총 좌석 수**: UI 성능을 위해 100석 이하 권장

### 권장사항

- **최소 행 수**: 3행 이상
- **최소 열 수**: 3열 이상
- **최적 비율**: 행:열 = 1:1 ~ 2:1
- **통로 너비**: 최소 1열 이상

## 🔍 디버깅

### 좌석이 표시되지 않을 때

1. **레이아웃 검증**
```typescript
console.log('Layout:', layout);
console.log('Total possible:', layout.rows * layout.columns);
console.log('Empty seats:', layout.emptySeats?.length || 0);
console.log('Actual seats:', getTotalSeats(layout));
```

2. **좌석 번호 확인**
```typescript
const allSeats = getAllValidSeats(layout);
console.log('Valid seats:', allSeats);
```

3. **렌더링 확인**
```typescript
console.log('Seat grid:', seatGrid.length);
console.log('Empty count:', seatGrid.filter(s => s.isEmpty).length);
```

## 📚 참고 자료

- `src/types/reservation.types.ts` - SeatLayout 타입 정의
- `src/components/student/SeatMap.tsx` - 좌석 렌더링 구현
- `src/components/student/Seat.tsx` - 개별 좌석 컴포넌트
- `src/services/studyRoom.service.ts` - 열람실 서비스

---

**마지막 업데이트**: 2025-01-03
