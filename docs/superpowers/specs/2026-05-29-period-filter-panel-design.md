# 자리 신청 — 요일별 교시 사전 필터 패널 설계

> **작성일**: 2026-05-29
> **상태**: 승인됨 (구현 대기)
> **대상 페이지**: `src/pages/ReservationPage.tsx`

## 1. 목표 (What & Why)

교시 선택이 가능한 열람실에서, **좌석을 선택하기 전에** 원하는 요일별 교시를 먼저 고르고, 그 조합으로 신청할 수 없는 좌석을 좌석 지도에서 **비활성화**한다.

현재는 좌석을 먼저 클릭한 뒤 교시 선택 모달에서야 점유 상태를 알 수 있다. 부분 예약된 좌석도 "가능"으로 보이다가 클릭 후에야 막힌 교시를 발견한다. 사전 필터 패널은 이 흐름을 개선해, 사용자가 원하는 교시 조합으로 가능한 좌석만 한눈에 보도록 한다.

## 2. 범위 (Scope)

**적용 대상**: `use_periods === true` **그리고** `period_booking_mode === 'INDIVIDUAL'` 인 열람실만.
- `INDIVIDUAL + UNIFORM`: 교시 개별 선택 (요일 무관 동일 적용)
- `INDIVIDUAL + PER_DAY`: 요일별로 다른 교시 선택

**제외 대상** (기존 동작 그대로 유지):
- `ALL_AT_ONCE` 모드 (모든 교시가 항상 일괄 예약 → 필터 무의미)
- 교시 미사용 열람실 (`use_periods !== true`)

## 3. 핵심 결정 사항 (Decisions)

| 항목 | 결정 |
|------|------|
| 적용 방식 | INDIVIDUAL 모드만 (UNIFORM + PER_DAY) |
| 패널 역할 | **필터 전용** — 좌석 지도만 좁힘. 실제 신청 교시는 기존 모달에서 최종 결정 |
| 좌석 활성 기준 | 선택한 슬롯이 **전부 비어있어야** 활성 (하나라도 차면 비활성) |
| 기본 선택 상태 | 진입 시 **전체 운영 요일×교시 선택됨** |
| UI 컴포넌트 | 공통 `PeriodSelector` 컴포넌트로 추출 → 필터 패널 + 기존 모달이 공유 |
| 모바일 배치 | 날짜 카드 아래 세로 배치 (데스크탑과 동일), PER_DAY 매트릭스는 가로 스크롤 |
| 비활성 좌석 스타일 | 기존 "예약됨" 회색 스타일 재사용 (별도 시각 구분 없음) + 패널 안내 문구 |

**중요**: 패널이 "필터 전용"이므로 신청 로직(`selectedPeriodIds`, `dayPeriodSelections`, `makeReservation`)과 기존 모달의 **동작은 바뀌지 않는다**. 패널 상태는 신청 상태와 완전히 분리된다. (단 모달 내부의 교시 선택 JSX는 §4.5 `PeriodSelector`로 교체되며, 이는 시각/동작이 동일한 순수 리팩터링이다.) 이로써 신청 플로우 회귀 위험이 최소화된다.

## 4. 아키텍처 & 데이터 흐름

### 4.1 새 상태 (ReservationPage)

필터 전용 상태 — 신청 상태와 별개:
- `filterPeriodIds: number[]` — UNIFORM 모드 필터 선택값
- `filterDaySelections: Record<number, number[]>` — PER_DAY 모드 필터 선택값 (요일→교시ID 배열)

초기값: 전체 운영 슬롯. `selectedRoom`이 바뀔 때 재초기화 (useEffect).

### 4.2 새 파생값 `filteredOccupiedSeats` (useMemo)

```
입력: reservations, 필터 선택값, operating_periods, operating_days,
      period_booking_mode, day_period_mode
출력: Set<string> — 선택된 슬롯 중 하나라도 예약된 좌석 번호

알고리즘:
  1. 선택된 슬롯 집합 구성:
     - UNIFORM → filterPeriodIds (모든 운영일에 동일 적용)
     - PER_DAY → filterDaySelections의 (요일, 교시) 쌍 집합
  2. reservations 순회, 각 예약 r:
     - 요일 = new Date(r.reservation_date + 'T00:00:00').getDay()
     - 교시 = r.period_id ?? 0
     - period_id === 0 (종일) → 해당 요일의 "모든 교시" 슬롯을 점유한 것으로 간주
     - 선택된 슬롯과 교집합이 존재하면 → result.add(r.seat_number)
  3. 반환
```

**모드별 동작**:
- **WEEKLY**: `reservations`가 선택된 단일 날짜만 포함 → 그 날짜 요일의 선택 슬롯만 유효. PER_DAY에서 다른 요일 선택은 그 날짜 필터에 영향 없음.
- **FIXED**: `reservations`가 운영 기간 전체 → 모든 요일 슬롯 검사. (기존 `useReservation.occupiedSeats`의 종일/슬롯 규칙과 동일한 규칙 사용)

### 4.3 SeatMap에 전달

```
const seatMapOccupied = (isIndividualPeriodRoom)
  ? filteredOccupiedSeats
  : occupiedSeats;   // 기존 useReservation 값
```

`SeatMap` / `Seat` 컴포넌트는 **변경 없음** — 이미 `occupiedSeats: Set<string>`로 비활성 처리하고 `mySeat` 예외를 둔다.

### 4.4 기존 모달

좌석 클릭 시 기존 교시 선택 모달은 **지금 그대로** 동작 (초깃값 = 비어있는 교시 전부). 패널과 무관하며 기존 신청 플로우 유지. 단 모달 내부 JSX는 4.5의 `PeriodSelector`로 교체된다(동작 동일).

### 4.5 공통 컴포넌트 추출 — `PeriodSelector`

신규 파일: `src/components/student/PeriodSelector.tsx`

모달 안에 인라인된 교시 선택 UI(현 `ReservationPage.tsx` 830~1051행)를 추출:
- **UNIFORM 모드**: 교시 버튼 그리드 (2열)
- **PER_DAY 모드**: 요일×교시 매트릭스 (행=교시, 열=요일, 전체 선택/해제, 행/열 헤더 토글)

```ts
interface PeriodSelectorProps {
  mode: 'UNIFORM' | 'PER_DAY';
  operatingPeriods: OperatingPeriod[];
  operatingDays: { day: number; label: string }[]; // PER_DAY 전용
  // 선택값 (제어 컴포넌트)
  uniformValue?: number[];                          // UNIFORM
  perDayValue?: Record<number, number[]>;           // PER_DAY
  onUniformChange?: (ids: number[]) => void;
  onPerDayChange?: (sel: Record<number, number[]>) => void;
  // occupied 판정 (모달에서만 사용; 필터 패널은 미전달)
  isPeriodOccupied?: (periodId: number, dayOfWeek?: number) => boolean;
  compact?: boolean;
}
```

**두 곳에서 사용**:
1. **필터 패널** (신규, 왼쪽 컬럼): `isPeriodOccupied` 미전달 → 순수 토글. 전체 선택/해제 포함.
2. **기존 모달**: `isPeriodOccupied` 전달 → occupied 교시 비활성. 동작은 추출 전과 동일.

> **위험**: 모달의 occupied 처리·전체선택 로직이 `selectedSeat`/`reservations`에 강하게 결합. 추출 시 회귀 위험 → 수동 테스트로 검증 (8장).

## 5. UI 배치

**위치**: 왼쪽 컬럼(`lg:col-span-4`) 내에서 "1. 날짜 선택" 카드와 "선택 정보" 카드 **사이**에 새 카드 삽입.

**조건부 렌더링**: `isIndividualPeriodRoom`일 때만.

**카드 구성**:
- 헤더: "교시 필터" (또는 단계 표시와 어울리는 제목)
- 안내 문구: "원하는 교시를 선택하면 신청 가능한 좌석만 활성화됩니다."
- 본문: `PeriodSelector` (필터 모드)
- 데스크탑·모바일 동일하게 세로 표시. PER_DAY 매트릭스는 `overflow-x-auto`.

## 6. 엣지 케이스

1. **교시 전체 해제** → 선택 슬롯 빈 집합 → 어떤 예약과도 안 겹침 → 모든 좌석 활성. 신청하려면 모달에서 교시 선택 필요. 패널 안내 문구로 맥락 제공.
2. **내 좌석 (mySeat)** → 필터와 무관하게 항상 클릭 가능 (SeatMap 기존 예외 유지).
3. **이용 불가 좌석 (unavailableSeats)** → 필터와 독립적으로 항상 비활성 (기존 로직).
4. **접수 기간 외 (`canReserveFinal === false`)** → SeatMap 전체 `disabled` (기존). 패널은 표시되나 무력.
5. **방 전환 (selectRoom)** → 필터 상태를 새 방의 전체 슬롯으로 재초기화.

## 7. 비활성 좌석 시각 처리

필터로 비활성된 좌석은 기존 "예약됨" 회색 스타일과 동일하게 표시 (Seat 컴포넌트 변경 없음, YAGNI). 맥락은 패널 안내 문구가 제공.

## 8. 검증 계획

`npm run build` (tsc + vite) 통과 + 수동 시나리오:

- [ ] **ALL_AT_ONCE 열람실**: 필터 패널 미표시, 기존 좌석 클릭→모달 동작 유지
- [ ] **교시 미사용 열람실**: 패널 미표시, 기존 동작 유지
- [ ] **INDIVIDUAL + UNIFORM**: 특정 교시만 선택 시 그 교시가 찬 좌석만 비활성. 전체 해제 시 전체 활성
- [ ] **INDIVIDUAL + PER_DAY (WEEKLY)**: 선택 날짜 요일의 교시 선택에 따라 필터. 다른 요일 선택은 영향 없음
- [ ] **INDIVIDUAL + PER_DAY (FIXED)**: 월=1교시, 화=2교시 선택 시 각 요일 슬롯별로 정확히 필터
- [ ] **종일 예약(period_id=0)**: 해당 요일 전체 교시 슬롯을 점유하는 것으로 처리되어 비활성
- [ ] **내 좌석**: 필터와 무관하게 항상 선택 가능
- [ ] **모달 추출 회귀**: 좌석 클릭→모달→교시 선택→신청 완료 플로우, occupied 교시 비활성, 전체 선택/해제 모두 추출 전과 동일

## 9. 변경 파일 요약

| 파일 | 변경 |
|------|------|
| `src/components/student/PeriodSelector.tsx` | **신규** — 교시 선택 UI 공통 컴포넌트 (UNIFORM/PER_DAY) |
| `src/pages/ReservationPage.tsx` | 필터 상태·`filteredOccupiedSeats` 추가, 필터 패널 카드 렌더링, SeatMap occupied 전환, 모달 내부 JSX를 `PeriodSelector`로 교체 |

`useReservation.ts`, `SeatMap.tsx`, `Seat.tsx`, 타입 정의는 **변경 없음**.
