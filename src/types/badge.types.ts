export interface Badge {
  id: number;
  temperature: number;
  name: string;
  description: string;
  image_path: string;
  created_at: string;
}

export interface BadgeAcquire {
  id: string;
  student_id: string;
  badge_id: number;
  acquired_at: string;
}

/** 뱃지 + 획득 상태를 합친 뷰 모델 */
export interface BadgeWithStatus extends Badge {
  /** 이미 획득했는지 */
  acquired: boolean;
  /** 획득 시간 (획득한 경우) */
  acquired_at?: string;
  /** 현재 온도로 획득 자격이 있는지 */
  eligible: boolean;
}
