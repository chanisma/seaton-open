# 여러 열람실 접수 기간 일괄 수정 — 설계 문서

> 작성일: 2026-06-29
> 상태: 승인됨 (구현 대기)

## 1. 목표

관리자가 **여러 열람실(study_rooms)의 예약 접수 기간을 한 번에 수정**할 수 있게 한다.
일괄 수정은 선택된 각 방의 **기존 접수 기간을 완전히 대체**한다.

## 2. 배경 — 데이터베이스 구조 조사 결과

접수 기간을 저장하는 컬럼이 `study_rooms`에 여러 개 존재한다. 조사 결과:

| 컬럼 | 타입 | 역할 | 코드 사용 |
|---|---|---|---|
| `booking_windows` | `jsonb` `[{id, label?, start, end}]` | **정본 — 멀티 접수 차수** | 읽기/쓰기 모두 |
| `booking_start_date` / `booking_end_date` | `timestamptz` (단일) | `@deprecated` 레거시 폴백 | 미러링 쓰기 + 폴백 읽기 |
| `fixed_start_date` / `fixed_end_date` | `date` | 운영 기간 (접수 기간 아님) | 범위 밖 |
| `operating_periods` | `jsonb` | 교시 (접수 기간 아님) | 범위 밖 |

### 검증된 코드 동작

- **읽기** `src/services/reservation.service.ts:252-256`: `booking_windows`가 비어있지 않으면 그것을 사용,
  비어있을 때만 `booking_start_date`/`booking_end_date`를 단일 window로 폴백.
- **쓰기** `src/pages/admin/RoomEditor.tsx:176-192`: `booking_windows` 배열을 저장하고,
  레거시 호환을 위해 `bookingWindows[0]`을 단일 컬럼에도 미러링.
- **로드** `src/pages/admin/RoomEditor.tsx:104-118`: `booking_windows` 우선, 없으면 단일 컬럼을 배열로 변환.
- 현재 24개 방 모두 `reservation_mode = 'FIXED'`이며 `booking_windows`에 정확히 1개 window 보유,
  단일 컬럼과 동기화된 상태.

### 결론

`booking_windows`(jsonb)가 정본이며 **멀티 접수 기간을 이미 지원**한다.
**DB 스키마 변경은 불필요**하다. 기존과 동일하게 첫 window를 deprecated 단일 컬럼에 미러링만 유지하면 된다
(읽기 폴백이 이에 의존).

## 3. 데이터 형태

```ts
// src/types/reservation.types.ts (기존)
export interface BookingWindow {
  id: number;
  label?: string;   // 접수 차수 이름 (예: "1차 접수")
  start: string;    // ISO/datetime-local 문자열 "YYYY-MM-DDTHH:mm"
  end: string;
}
```

datetime 값은 `datetime-local` 입력 형식(`YYYY-MM-DDTHH:mm`, 분 단위)을 그대로 저장한다 — 기존 단일 수정과 동일.

## 4. UI / 진입점

`RoomManagement` 목록(테이블)에 체크박스 + 일괄수정 버튼을 추가한다.

- 테이블 첫 열에 체크박스 컬럼 추가. 헤더에 전체선택 체크박스(선택 가능한 행만 대상).
- **WEEKLY(주 단위) 방은 체크박스 비활성화** + "기간제 전용" 안내 (접수 기간 개념 없음).
- 1개 이상 선택 시 상단에 일괄수정 툴바: "N개 선택됨" + "접수 기간 일괄 수정" + "선택 해제".
- 버튼 클릭 시 `BulkBookingWindowsModal` 오픈.

## 5. 컴포넌트 구조

### 5.1 `BookingWindowsEditor` (신규 공용 컴포넌트)

`src/components/admin/BookingWindowsEditor.tsx`

- **제어 컴포넌트**: props `value: BookingWindow[]`, `onChange: (windows: BookingWindow[]) => void`,
  그리고 검증 실패 메시지 표시를 위한 `onError?: (msg: string) => void`.
- 책임: 차수 목록 렌더 + 추가/수정/삭제 + 검증.
- 검증 규칙(기존 `RoomEditor`에서 그대로 이전):
  - 시작·마감 모두 필수.
  - `new Date(start) >= new Date(end)`이면 거부 ("접수 마감이 시작보다 이후여야 합니다.").
  - 새 id = `max(기존 id) + 1` (없으면 1).
  - 라벨 미입력 시 `${id}차 접수`.
- 이 컴포넌트는 **현재 `RoomEditor.tsx`에 인라인으로 존재하는 booking window UI(약 170줄, 라인 500-668 등)를 추출**한 것이다.
  `RoomEditor`도 이 컴포넌트를 사용하도록 리팩터링하여 단일 수정과 일괄 수정이 동일한 UI/검증을 공유한다(DRY).

### 5.2 `BulkBookingWindowsModal` (신규)

`src/components/admin/BulkBookingWindowsModal.tsx`

- props: `isOpen: boolean`, `selectedRooms: StudyRoom[]`, `onClose: () => void`, `onApplied: () => void`.
- 내부 상태: `windows: BookingWindow[]` (초기값 빈 배열 — 일괄 입력은 새로 작성하는 것이므로 기존 값으로 프리필하지 않음).
- 표시:
  - 상단에 "선택된 N개 방" + 방 이름 목록.
  - `BookingWindowsEditor`로 접수 기간 입력.
  - "기존 접수 기간을 **완전히 대체**합니다" 경고 문구.
  - `windows`가 빈 배열일 때 저장하면 "접수 기간이 모두 삭제됩니다" 추가 확인.
- 저장(`handleApply`): 선택된 각 방에 대해 개별 update 실행.

### 5.3 `RoomManagement.tsx` 수정

- `selectedIds: Set<string>` 상태 추가. FIXED 방만 선택 가능.
- 테이블에 체크박스 열 추가, WEEKLY 행은 `disabled`.
- 선택이 있을 때 일괄수정 툴바 노출.
- 모달 `onApplied` 콜백에서 `refreshStudyRooms()` 호출 + `selectedIds` 초기화.

## 6. 저장 처리 (방마다)

개별 `update` + 부분 실패 보고 방식 (기존 인라인 수정 패턴과 동일, 새 RPC/마이그레이션 불필요).

```ts
const payload = {
  booking_windows: windows,                       // 입력 배열로 완전 대체 (빈 배열 허용)
  booking_start_date: windows[0]?.start ?? null,  // 레거시 미러링
  booking_end_date:   windows[0]?.end   ?? null,  // 레거시 미러링
};

let ok = 0, fail = 0;
for (const room of selectedRooms) {
  const { error } = await supabase
    .from('study_rooms')
    .update(payload as never)
    .eq('id', room.id);
  if (error) fail++; else ok++;
}
// 토스트: `${ok}개 적용, ${fail}개 실패` (fail > 0이면 경고색)
```

- `reservation_mode`는 변경하지 않는다 (대상이 이미 FIXED).
- 모두 성공 시 success 토스트, 일부 실패 시 실패 개수 포함 warning/error 토스트.

## 7. 엣지 케이스

- **WEEKLY 방**: 선택 불가(체크박스 disabled). 일괄수정 대상에서 원천 배제.
- **빈 접수 기간 저장**: 허용하되 확인 절차를 거친다 → 선택된 방들의 접수 기간이 모두 삭제됨.
- **부분 실패**: 성공한 방은 적용된 상태로 두고 실패 개수만 보고. 전체 롤백하지 않음.
- **datetime 형식**: `datetime-local`의 `YYYY-MM-DDTHH:mm` 그대로 저장 (기존 단일 수정과 동일하게 처리).

## 8. 테스트 / 검증

- `npm run type-check` 및 `npm run build` 통과.
- 수동 검증:
  1. FIXED 방 2개 선택 → 차수 2개 입력 → 저장 → DB `booking_windows`가 교체되고 단일 컬럼이 첫 window로 미러링됐는지 확인.
  2. WEEKLY 방 체크박스가 비활성인지 확인.
  3. 빈 배열 저장 시 확인 모달 후 접수 기간이 삭제되는지 확인.
  4. `RoomEditor` 단일 수정이 추출된 `BookingWindowsEditor`로 여전히 동일하게 동작하는지 확인 (추가/수정/삭제/검증).

## 9. 범위 밖 (Non-goals)

- `operating_periods`(교시) 일괄 수정.
- `fixed_start_date`/`fixed_end_date`(운영 기간) 일괄 수정.
- WEEKLY 방의 접수 설정 변경.
- DB 스키마 변경(불필요).
- deprecated 단일 컬럼 제거(별도 마이그레이션 작업으로 분리).
