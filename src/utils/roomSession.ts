/**
 * 열람실의 아침/야간 구분 유틸리티
 *
 * ⚠️ study_rooms 테이블에 시간대를 나타내는 컬럼이 없어 열람실 **이름 기반 휴리스틱**을 사용합니다.
 *    열람실 이름을 바꾸면 통계가 조용히 틀리게 되므로,
 *    DB에 session/type 컬럼이 생기면 이 파일의 구현만 교체하면 됩니다.
 *    (기존에는 이 로직이 통계 페이지 두 곳에 복사되어 있었습니다.)
 */

export const MORNING_ROOM_KEYWORD = '아침';

/** 열람실 이름이 아침 자습실인지 판별합니다. */
export const isMorningRoom = (roomName: string): boolean => roomName.includes(MORNING_ROOM_KEYWORD);

/**
 * 해당 요일에 신청한 열람실 목록을 '아침' / '야간' / '아침, 야간' 표기로 변환합니다.
 * 신청이 없으면 '-'를 반환합니다.
 */
export const formatRoomSessions = (roomNames: string[] | undefined | null): string => {
  if (!roomNames || roomNames.length === 0) return '-';

  const hasMorning = roomNames.some(isMorningRoom);
  const hasNight = roomNames.some(name => !isMorningRoom(name));

  if (hasMorning && hasNight) return '아침, 야간';
  return hasMorning ? '아침' : '야간';
};
