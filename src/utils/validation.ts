import { ALLOWED_EMAIL_DOMAIN } from './constants';

/**
 * 이메일 도메인 검증
 */
export const isValidEmailDomain = (email: string): boolean => {
  return email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
};

/**
 * 이메일 형식 검증
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 차단된 이메일 접두사 목록
 */
const BLOCKED_EMAIL_PREFIXES = ['kijungpt'];

/**
 * 차단된 이메일인지 검증
 */
export const isBlockedEmail = (email: string): boolean => {
  const localPart = email.split('@')[0].toLowerCase();
  return BLOCKED_EMAIL_PREFIXES.some(prefix => localPart.startsWith(prefix));
};

/**
 * 학생 이메일 형식 검증 (##-#####@myschool.hs.kr)
 */
export const isStudentEmail = (email: string): boolean => {
  const studentEmailRegex = /^\d{2}-\d{5}@myschool\.hs\.kr$/;
  return studentEmailRegex.test(email);
};

/**
 * 좌석 번호 검증
 */
export const isValidSeatNumber = (seatNumber: string): boolean => {
  return seatNumber.trim().length > 0;
};

/**
 * 학년 검증 (1, 2, 3)
 */
export const isValidGrade = (grade: number): boolean => {
  return [1, 2, 3].includes(grade);
};
