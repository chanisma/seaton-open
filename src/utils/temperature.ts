/**
 * 학생 온도 시스템 유틸리티
 * 기본 온도: 28도
 * 출석: +0.5도
 * 결석: -1.0도
 */

export const BASE_TEMPERATURE = 28.0;
export const ATTENDANCE_INCREMENT = 0.5;
export const ABSENCE_DECREMENT = 1.0;
export const FEEDBACK_INCREMENT = 0.1;
export const FEEDBACK_DEADLINE_DAYS = 7;

/**
 * 출석/결석 횟수를 기반으로 온도를 계산합니다.
 */
export const calculateTemperature = (attended: number, absent: number): number => {
  const temp = BASE_TEMPERATURE + attended * ATTENDANCE_INCREMENT - absent * ABSENCE_DECREMENT;
  // 소수점 첫째 자리까지 반올림
  return Math.round(temp * 10) / 10;
};

/**
 * 온도에 따른 격려 메시지를 반환합니다.
 */
export const getTemperatureMessage = (temperature: number): string => {
  if (temperature >= 100) return '전설적인 열정입니다! 명예의 전당에 오를 자격이 충분해요! 🔥';
  if (temperature >= 80) return '놀라운 성실함입니다! 당신의 열정이 주변을 밝히고 있어요! ☀️';
  if (temperature >= 60) return '꾸준함이 빛을 발하고 있습니다! 계속해서 나아가세요! ✨';
  if (temperature >= 40) return '좋은 흐름입니다! 성실한 태도가 멋진 결과를 만들 거예요. 👍';
  if (temperature >= 30) return '시작이 좋습니다! 조금 더 힘내서 온도를 높여볼까요? 🌱';
  if (temperature >= 20) return '아직 늦지 않았어요. 꾸준한 출석으로 온도를 높여보세요! 💪';
  return '힘을 내세요! 작은 노력들이 모여 큰 변화를 만듭니다. 🌈';
};

/**
 * 온도에 따른 색상 클래스를 반환합니다.
 */
export const getTemperatureColor = (temperature: number): string => {
  if (temperature >= 80) return 'text-red-600 dark:text-red-400';
  if (temperature >= 60) return 'text-orange-500 dark:text-orange-400';
  if (temperature >= 40) return 'text-green-600 dark:text-green-400';
  if (temperature >= 30) return 'text-blue-600 dark:text-blue-400';
  return 'text-muted-foreground';
};

/**
 * 배움의 불꽃 단계 시스템
 * 혼자 품은 작은 동기(불씨)가 점점 커져서 다른 사람에게까지 신호를 보내는 봉화가 되는 이미지
 */
export interface FlameTier {
  name: string;
  icon: string; // SVG path
  color: string; // Tailwind text color
  bgColor: string; // Tailwind bg color
  glowColor: string; // Tailwind ring/shadow color
  description: string;
}

export const getFlameTier = (temperature: number): FlameTier => {
  if (temperature >= 80)
    return {
      name: '봉화',
      icon: 'beacon',
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/30',
      glowColor: 'ring-red-400/50 shadow-red-500/20',
      description: '멀리까지 신호를 보내는 열정의 봉화',
    };
  if (temperature >= 60)
    return {
      name: '모닥불',
      icon: 'campfire',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/30',
      glowColor: 'ring-orange-400/50 shadow-orange-500/20',
      description: '주변까지 따뜻하게 하는 모닥불',
    };
  if (temperature >= 40)
    return {
      name: '횃불',
      icon: 'torch',
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/30',
      glowColor: 'ring-amber-400/50 shadow-amber-500/20',
      description: '스스로 빛을 내는 횃불',
    };
  if (temperature >= 30)
    return {
      name: '불꽃',
      icon: 'flame',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/30',
      glowColor: 'ring-yellow-400/50 shadow-yellow-500/20',
      description: '피어오르는 배움의 불꽃',
    };
  return {
    name: '불씨',
    icon: 'ember',
    color: 'text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/30',
    glowColor: 'ring-blue-400/50 shadow-blue-500/20',
    description: '작은 동기의 시작, 불씨',
  };
};
