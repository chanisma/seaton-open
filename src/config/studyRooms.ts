import type { StudyRoom, SeatLayout } from '@project-types/reservation.types';

/**
 * 고정된 열람실 구조 정의
 * 각 학년마다 하나의 열람실이 존재합니다.
 * 좌석은 섹션으로 나뉘어 있으며, 섹션 사이에는 통로가 있습니다.
 */

/**
 * 1학년 열람실 좌석 배치 (Mock)
 * 구조:
 * [ ][ ]    [ ][ ]    [ ][ ]   <- 2x2 섹션 3개
 * [ ][ ]    [ ][ ]    [ ][ ]
 *
 * [ ][ ]    [ ][ ]    [ ][ ]   <- 2x2 섹션 3개
 * [ ][ ]    [ ][ ]    [ ][ ]
 *
 * [ ][ ][ ][ ]    [ ][ ][ ][ ] <- 1x4 섹션 2개
 *
 * 총 32석
 */
const GRADE_1_LAYOUT: SeatLayout = {
  totalRows: 9,
  totalColumns: 18,
  sections: [
    // 상단 행
    { rows: 2, columns: 2, startRow: 0, startCol: 0 }, // 좌측
    { rows: 2, columns: 2, startRow: 0, startCol: 6 }, // 중앙
    { rows: 2, columns: 2, startRow: 0, startCol: 12 }, // 우측
    // 중단 행
    { rows: 2, columns: 2, startRow: 3, startCol: 0 }, // 좌측
    { rows: 2, columns: 2, startRow: 3, startCol: 6 }, // 중앙
    { rows: 2, columns: 2, startRow: 3, startCol: 12 }, // 우측
    // 하단 행
    { rows: 1, columns: 4, startRow: 6, startCol: 0 }, // 좌측
    { rows: 1, columns: 4, startRow: 6, startCol: 10 }, // 우측
  ],
  emptySeats: [],
};

/**
 * 2학년 열람실 좌석 배치 (Mock)
 * 1학년보다 조금 더 큰 구조 (총 40석)
 */
const GRADE_2_LAYOUT: SeatLayout = {
  totalRows: 9,
  totalColumns: 20,
  sections: [
    // 상단 행 (2x3 섹션 3개)
    { rows: 2, columns: 3, startRow: 0, startCol: 0 },
    { rows: 2, columns: 3, startRow: 0, startCol: 6 },
    { rows: 2, columns: 3, startRow: 0, startCol: 12 },
    // 중단 행 (2x3 섹션 3개)
    { rows: 2, columns: 3, startRow: 3, startCol: 0 },
    { rows: 2, columns: 3, startRow: 3, startCol: 6 },
    { rows: 2, columns: 3, startRow: 3, startCol: 12 },
    // 하단 행 (2x4 섹션 2개)
    { rows: 2, columns: 4, startRow: 6, startCol: 0 },
    { rows: 2, columns: 4, startRow: 6, startCol: 10 },
  ],
  emptySeats: [],
};

/**
 * 3학년 열람실 좌석 배치 (Mock)
 * 가장 큰 구조 (총 48석)
 */
const GRADE_3_LAYOUT: SeatLayout = {
  totalRows: 12,
  totalColumns: 20,
  sections: [
    // 상단 행 (3x3 섹션 3개)
    { rows: 3, columns: 3, startRow: 0, startCol: 0 },
    { rows: 3, columns: 3, startRow: 0, startCol: 6 },
    { rows: 3, columns: 3, startRow: 0, startCol: 12 },
    // 중상단 행 (3x3 섹션 3개)
    { rows: 3, columns: 3, startRow: 4, startCol: 0 },
    { rows: 3, columns: 3, startRow: 4, startCol: 6 },
    { rows: 3, columns: 3, startRow: 4, startCol: 12 },
    // 하단 행 (2x4 섹션 2개)
    { rows: 2, columns: 4, startRow: 8, startCol: 0 },
    { rows: 2, columns: 4, startRow: 8, startCol: 10 },
  ],
  emptySeats: [],
};

/**
 * 좌석 수 계산 헬퍼 함수
 */
const calculateTotalSeats = (layout: SeatLayout): number => {
  return layout.sections.reduce((total, section) => {
    return total + section.rows * section.columns;
  }, 0);
};

/**
 * 열람실 정의
 * 데이터베이스가 아닌 코드로 관리됩니다.
 */
export const STUDY_ROOMS: Record<number, Omit<StudyRoom, 'created_at' | 'updated_at'>> = {
  1: {
    id: '76f92303-2205-4f90-b48e-ac91edbbe118',
    name: '1학년 열람실',
    grade: 1,
    grades: [1],
    total_seats: calculateTotalSeats(GRADE_1_LAYOUT), // 32석
    seat_layout: GRADE_1_LAYOUT,
    is_active: true,
    reservation_mode: 'WEEKLY',
  },
  2: {
    id: '67fa3cf4-8f3a-452f-b548-d3e732af5633',
    name: '2학년 열람실',
    grade: 2,
    grades: [2],
    total_seats: calculateTotalSeats(GRADE_2_LAYOUT), // 52석
    seat_layout: GRADE_2_LAYOUT,
    is_active: true,
    reservation_mode: 'WEEKLY',
  },
  3: {
    id: 'eeca80e5-4ad7-4200-9418-1bafe466b0ae',
    name: '3학년 열람실',
    grade: 3,
    grades: [3],
    total_seats: calculateTotalSeats(GRADE_3_LAYOUT), // 70석
    seat_layout: GRADE_3_LAYOUT,
    is_active: true,
    reservation_mode: 'WEEKLY',
  },
};

/**
 * 모든 열람실 조회
 */
export const getAllStudyRooms = (): Omit<StudyRoom, 'created_at' | 'updated_at'>[] => {
  return Object.values(STUDY_ROOMS);
};

/**
 * 특정 학년의 열람실 조회
 */
export const getStudyRoomByGrade = (
  grade: number
): Omit<StudyRoom, 'created_at' | 'updated_at'> | null => {
  return STUDY_ROOMS[grade] || null;
};

/**
 * 열람실 ID로 조회
 */
export const getStudyRoomById = (
  id: string
): Omit<StudyRoom, 'created_at' | 'updated_at'> | null => {
  return Object.values(STUDY_ROOMS).find(room => room.id === id) || null;
};

/**
 * 좌석 번호 생성 (전체 grid 기준)
 */
export const generateSeatNumber = (row: number, column: number): string => {
  const rowLetter = String.fromCharCode(65 + row); // A, B, C, ...
  const colNumber = column + 1; // 1, 2, 3, ...
  return `${rowLetter}${colNumber}`;
};

/**
 * 열람실의 모든 유효한 좌석 번호 목록 반환 (섹션 기반)
 */
export const getValidSeats = (grade: number): string[] => {
  const room = STUDY_ROOMS[grade];
  if (!room) return [];

  const { sections, emptySeats = [] } = room.seat_layout;
  const seats: string[] = [];

  // 각 섹션을 순회하며 좌석 번호 생성
  sections.forEach(section => {
    for (let r = 0; r < section.rows; r++) {
      for (let c = 0; c < section.columns; c++) {
        const globalRow = section.startRow + r;
        const globalCol = section.startCol + c;
        const seatNumber = generateSeatNumber(globalRow, globalCol);

        if (!emptySeats.includes(seatNumber)) {
          seats.push(seatNumber);
        }
      }
    }
  });

  return seats;
};

/**
 * 좌석 번호 유효성 검증
 */
export const isValidSeat = (grade: number, seatNumber: string): boolean => {
  const validSeats = getValidSeats(grade);
  return validSeats.includes(seatNumber);
};
