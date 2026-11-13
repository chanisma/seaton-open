/** 퍼즐 그리드 크기 */
export type PuzzleGridSize = '3x4' | '4x3';

/** 퍼즐 이벤트 상태 */
export type PuzzleEventStatus = 'upcoming' | 'active' | 'ended';

/** 포인트 트랜잭션 유형 */
export type PointTransactionType = 'attendance' | 'review' | 'puzzle_unlock';

/**
 * 퍼즐 이벤트 - 관리자가 생성하는 퍼즐 챌린지
 */
export interface PuzzleEvent {
  id: string;
  title: string;
  description: string;
  /** 원본 이미지 경로 (Supabase Storage) */
  image_url: string;
  /** 퍼즐 그리드 크기 */
  grid_size: PuzzleGridSize;
  /** 총 퍼즐 조각 수 (3x4=12, 4x3=12) */
  total_pieces: number;
  /** 조각 하나 오픈에 필요한 포인트 */
  piece_cost: number;
  /** 이벤트 시작일 */
  start_date: string;
  /** 이벤트 종료일 (이 날짜까지 완성해야 소장) */
  end_date: string;
  /** 활성 여부 */
  is_active: boolean;
  created_at: string;
}

/**
 * 퍼즐 조각 - 이미지 분할 후 저장되는 개별 조각
 */
export interface PuzzlePiece {
  id: string;
  event_id: string;
  /** 조각 인덱스 (0부터, 왼쪽→오른쪽, 위→아래 순서) */
  piece_index: number;
  /** 조각 이미지 경로 (Supabase Storage) */
  image_url: string;
  created_at: string;
}

/**
 * 포인트 트랜잭션 - 포인트 획득/사용 이력
 */
export interface PointTransaction {
  id: string;
  student_id: string;
  /** 포인트 변동량 (양수: 획득, 음수: 사용) */
  amount: number;
  /** 트랜잭션 유형 */
  type: PointTransactionType;
  /** 관련 참조 ID (예약 ID 또는 퍼즐 이벤트 ID) */
  reference_id?: string;
  description: string;
  created_at: string;
}

/**
 * 학생 포인트 잔액 (집계 뷰)
 */
export interface StudentPoints {
  student_id: string;
  total_earned: number;
  total_spent: number;
  balance: number;
}

/**
 * 학생 퍼즐 진행도 - 어떤 조각을 오픈했는지
 */
export interface StudentPuzzleProgress {
  id: string;
  student_id: string;
  event_id: string;
  piece_index: number;
  unlocked_at: string;
}

/**
 * 학생 퍼즐 컬렉션 - 완성한 퍼즐 소장
 */
export interface StudentPuzzleCollection {
  id: string;
  student_id: string;
  event_id: string;
  completed_at: string;
}

/** 퍼즐 이벤트 + 학생 진행도 뷰 모델 */
export interface PuzzleEventWithProgress extends PuzzleEvent {
  /** 오픈한 조각 인덱스 배열 */
  unlocked_pieces: number[];
  /** 완성 여부 */
  is_completed: boolean;
  /** 소장 여부 */
  is_collected: boolean;
  /** 이벤트 상태 */
  status: PuzzleEventStatus;
}

/** 퍼즐 조각 오픈 결과 */
export interface UnlockPieceResult {
  success: boolean;
  piece_index: number;
  remaining_points: number;
  is_puzzle_completed: boolean;
}

/** 이미지 분할 결과 */
export interface SplitImageResult {
  pieces: Blob[];
  rows: number;
  cols: number;
}
