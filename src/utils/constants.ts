// 도메인 제한
export const ALLOWED_EMAIL_DOMAIN = 'myschool.hs.kr';

// 신청 설정 기본값
export const DEFAULT_RESERVATION_SETTINGS = {
  OPEN_DAY: 0, // 일요일
  OPEN_TIME: '20:00',
  MAX_DAYS_AHEAD: 5, // 월~금
};

// 프로필 캐시(localStorage) 유효 기간
// resource.meta의 학년/반은 진급 때만 바뀌므로 하루 한 번 다시 읽으면 충분하다.
export const PROFILE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// 학년
export const GRADES = [1, 2, 3] as const;
export type Grade = (typeof GRADES)[number];

// 요일
export const WEEKDAYS = ['월', '화', '수', '목', '금'] as const;
export const WEEKDAY_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;

// 좌석 상태
export const SEAT_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  MY_SEAT: 'my_seat',
  SELECTED: 'selected',
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_DOMAIN: '@myschool.hs.kr 도메인만 사용 가능합니다.',
    LOGIN_FAILED: '로그인에 실패했습니다.',
    LOGOUT_FAILED: '로그아웃에 실패했습니다.',
    UNAUTHORIZED: '권한이 없습니다.',
  },
  RESERVATION: {
    DUPLICATE: '이미 신청한 자리입니다.',
    SEAT_OCCUPIED: '이미 예약된 자리입니다.',
    TIME_RESTRICTED: '신청 가능 시간이 아닙니다.',
    FAILED: '신청에 실패했습니다.',
    CANCEL_FAILED: '취소에 실패했습니다.',
  },
  COMMON: {
    NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
    UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
  },
} as const;

// 성공 메시지
export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: '로그인되었습니다.',
    LOGOUT_SUCCESS: '로그아웃되었습니다.',
  },
  RESERVATION: {
    CREATED: '자리가 신청되었습니다.',
    CANCELLED: '신청이 취소되었습니다.',
    ATTENDANCE_CHECKED: '출석 처리되었습니다.',
  },
} as const;
