import { useEffect, useMemo, useState } from 'react';

/**
 * Tailwind는 darkMode: 'class' 설정이라 <html>의 class로 다크 모드를 판별합니다.
 * Recharts는 className을 못 쓰고 실제 색상 값이 필요하므로 여기서 현재 테마를 읽습니다.
 */
export const useIsDarkMode = (): boolean => {
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains('dark'));

    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  return isDark;
};

export interface ChartTheme {
  /** CartesianGrid stroke */
  grid: string;
  /** 축 눈금 텍스트 색 */
  axisTick: string;
}

/** 라이트/다크 모드에 맞는 차트 축·그리드 색상 */
export const useChartTheme = (): ChartTheme => {
  const isDark = useIsDarkMode();

  return useMemo(
    () => ({
      grid: isDark ? '#374151' : '#E5E7EB',
      axisTick: isDark ? '#9CA3AF' : '#6B7280',
    }),
    [isDark]
  );
};
