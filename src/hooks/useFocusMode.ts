import { useRef, useCallback } from 'react';
import { useTimer } from './useTimer';
import { useFullscreen } from './useFullscreen';
import { usePageVisibility } from './usePageVisibility';

export const useFocusMode = (speed: number = 1) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(
    containerRef as React.RefObject<HTMLElement>
  );
  const { isVisible } = usePageVisibility();

  const isFocusing = isFullscreen && isVisible;
  const isPaused = isFullscreen && !isVisible;

  const { elapsedSeconds, formattedTime, reset } = useTimer(isFocusing, speed);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  return {
    isFocusing,
    isPaused,
    elapsedSeconds,
    formattedTime,
    isFullscreen,
    toggleFullscreen,
    reset: handleReset,
    containerRef,
  };
};
