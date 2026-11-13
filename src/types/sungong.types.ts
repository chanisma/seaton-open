import { Profile } from './user.types';

/**
 * 순공(방학학습) 관련 타입 정의
 *
 * - 순공 여부는 study_rooms.is_sungong 플래그로 관리
 * - 좌석 A/B반은 SeatLayout.seatZones(reservation.types.ts)에 저장
 * - 순공 대상자 명단(약점 과목 포함)은 sungong_students 테이블
 * - 출석은 seat_reservations 재사용 + attendance_status='supplement'(보완)
 */

/** 좌석 A/B 구역 = 순공 "반" */
export type SungongZone = 'A' | 'B';

/** 순공 대상자 명단 1행 (roster) — 학년 단위로 공유 */
export interface SungongStudent {
  id: string;
  grade: number; // 학년 (명단은 학년 단위)
  zone: SungongZone; // 반 (A/B) — 명단에 명시 저장
  student_id: string; // profiles.id 참조
  remedial_subject?: string | null; // 약점(보완) 과목명
  room_id?: string | null; // 레거시 참조(선택)
  created_at: string;
  updated_at: string;
  // Supabase join 결과
  profiles?: Profile;
}

/** enrichment(학년/반/번호/이름) 병합된 명단 행 */
export interface SungongStudentWithDetails extends SungongStudent {
  student_name?: string;
  student_grade?: number;
  student_class?: number;
  student_number?: string; // 학번 (GCCNN: 학년+반2자리+번호2자리, 예: 30101)
  seat_number?: string; // 배정(예약) 좌석
}

/** 교시별 출석 셀 상태 (출석부 렌더링용) */
export type SungongPeriodMark =
  | 'present' // 출석 → '.'
  | 'supplement' // 보완 → 약점 과목명
  | 'none'; // 미처리 → '/'

/** 학생 단위 출석 통계 (순공 탭) */
export interface SungongStudentStat {
  student_id: string;
  student_name: string;
  student_grade?: number;
  student_class?: number;
  student_number?: string;
  zone?: SungongZone;
  remedial_subject?: string | null;
  totalPeriods: number; // 집계 대상 (운영일 × 교시) 총 칸 수
  presentCount: number; // 출석
  supplementCount: number; // 보완
  noneCount: number; // 미처리
  attendanceRate: number; // 0~100 = (present+supplement)/total
}

/** 자습일별 출석 요약 (학년 내 반별 집계) */
export interface SungongDailySummary {
  date: string; // YYYY-MM-DD
  grade: number;
  zone: SungongZone; // 반 (A/B)
  total: number; // 해당 반 인원 × 교시
  presentCount: number;
  supplementCount: number;
  noneCount: number;
}
