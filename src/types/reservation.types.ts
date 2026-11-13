import { Profile } from './user.types';

export type AttendanceStatus = 'attended' | 'excused' | 'supplement' | null;

export interface OperatingPeriod {
  id: number;
  name: string;
  start_time: string; // HH:mm
  end_time: string; // HH:mm
}

export interface BookingWindow {
  id: number;
  label?: string; // 접수 차수 이름 (예: "1차 접수", "추가 접수")
  start: string; // 접수 시작 일시 (ISO string)
  end: string; // 접수 마감 일시 (ISO string)
}

export interface StudyRoom {
  id: string;
  name: string;
  grade?: number; // @deprecated use grades instead
  grades: number[]; // 해당 학년들 (1, 2, 3)
  total_seats: number;
  seat_layout: SeatLayout;
  is_active: boolean;
  reservation_mode: 'WEEKLY' | 'FIXED';
  fixed_start_date?: string; // FIXED 모드일 때 사용 (YYYY-MM-DD)
  fixed_end_date?: string; // FIXED 모드일 때 사용 (YYYY-MM-DD)
  booking_start_date?: string; // @deprecated booking_windows 사용 권장
  booking_end_date?: string; // @deprecated booking_windows 사용 권장
  booking_windows?: BookingWindow[]; // 멀티 예약 접수 기간
  rules?: string; // 열람실 이용 규칙
  is_saturday_open?: boolean; // @deprecated operating_days 사용 권장
  is_sunday_open?: boolean; // @deprecated operating_days 사용 권장
  operating_days?: number[]; // 운영 요일 (0=일, 1=월, ..., 6=토). 미설정 시 레거시 필드에서 유추
  use_periods?: boolean; // 교시 사용 여부
  operating_periods?: OperatingPeriod[]; // 교시 설정
  period_booking_mode?: 'ALL_AT_ONCE' | 'INDIVIDUAL'; // 교시 신청 방식 (기본: ALL_AT_ONCE)
  day_period_mode?: 'UNIFORM' | 'PER_DAY'; // 요일별 교시 설정 (기본: UNIFORM)
  allow_duplicate_reservation?: boolean; // 중복 신청 허용 여부 (기본: false)
  is_sungong?: boolean; // 순공(방학학습) 열람실 여부
  created_at: string;
}

// 요일(0=일~6=토) → 선택된 교시 ID 배열
export type DayPeriodSelection = Record<number, number[]>;

// 좌석 섹션 정의 (통로로 구분된 좌석 그룹)
export interface SeatSection {
  rows: number; // 이 섹션의 행 수
  columns: number; // 이 섹션의 열 수
  startRow: number; // 전체 grid에서의 시작 행 (0부터)
  startCol: number; // 전체 grid에서의 시작 열 (0부터)
}

export interface SeatLayout {
  totalRows: number; // 전체 grid 행 수 (통로 포함)
  totalColumns: number; // 전체 grid 열 수 (통로 포함)
  sections: SeatSection[]; // 실제 좌석이 있는 섹션들
  emptySeats?: string[]; // 비활성 좌석 번호 (예: ['A3', 'B5']) - 이건 아예 안보이는(통로처리) 좌석
  unavailableSeats?: string[]; // 사용 불가 좌석 번호 (예: ['C1']) - 보이긴 하지만 예약 불가
  seatZones?: Record<string, 'A' | 'B'>; // 순공 좌석별 반 (예: { A1: 'A', A3: 'B' }). 사용 가능 좌석에만 설정
}

// 하위 호환성을 위한 레거시 타입 (필요시 사용)
export interface SeatInfo {
  number: string;
  row: number;
  col: number;
  isAvailable: boolean;
}

export interface SeatReservation {
  id: string;
  student_id: string; // profiles.id 참조
  room_id: string;
  seat_number: string;
  reservation_date: string; // ISO date string
  period_id?: number | null; // 교시 ID (0 or null = All Day) — DB 컬럼이 nullable
  is_attended: boolean;
  attendance_status?: AttendanceStatus;
  attended_at?: string | null;
  checked_by?: string | null; // 교사 profiles.id
  feedback_rating?: number | null; // 피드백 별점 (1~5)
  feedback_note?: string | null; // 피드백 비고
  feedback_at?: string | null; // 피드백 작성 시간
  created_at: string;
  // Supabase join 결과
  profiles?: Profile; // student_id로 조인된 profiles
  checker?: Profile; // checked_by로 조인된 profiles (교사)
  study_rooms?: StudyRoom; // room_id로 조인된 study_rooms
}

// DB 테이블 구조와 1:1 매핑되는 타입 (Join 필드 제외)
export interface SeatReservationDB {
  id: string;
  student_id: string;
  room_id: string;
  seat_number: string;
  reservation_date: string;
  period_id?: number;
  is_attended: boolean;
  attendance_status?: AttendanceStatus;
  attended_at?: string | null;
  checked_by?: string | null;
  created_at: string;
}

export interface ReservationSettings {
  id: string;
  reservation_open_day: number; // 0: 일요일
  reservation_open_time: string; // HH:mm format
  max_days_ahead: number; // 최대 며칠 앞까지 신청 가능
  terms_and_conditions?: string;
  updated_at: string;
}

export interface ReservationWithDetails extends SeatReservation {
  student_name?: string;
  student_grade?: number;
  student_class?: number;
  student_id_number?: string;
  room_name?: string;
}
