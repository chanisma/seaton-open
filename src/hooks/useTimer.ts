import { useState, useEffect, useRef, useCallback } from 'react';

const formatTime = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
};

export const useTimer = (isActive: boolean, speed: number = 1) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + speedRef.current);
      }, 1000);
    } else {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive]);

  const reset = useCallback(() => {
    setElapsedSeconds(0);
  }, []);

  return {
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    reset,
  };
};
