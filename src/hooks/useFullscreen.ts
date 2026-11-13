import { useState, useEffect, useCallback } from 'react';
import React from 'react';

export const useFullscreen = (elementRef?: React.RefObject<HTMLElement>) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener('fullscreenchange', handleChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleChange);
    };
  }, []);

  // Exit fullscreen on any key press
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore F11 (browser fullscreen toggle) to avoid conflicts
      if (e.key === 'F11') return;
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  const getTarget = useCallback((): HTMLElement => {
    return elementRef?.current ?? document.documentElement;
  }, [elementRef]);

  const requestFullscreen = useCallback(async (): Promise<void> => {
    const target = getTarget();
    if (!document.fullscreenElement) {
      await target.requestFullscreen();
    }
  }, [getTarget]);

  const exitFullscreen = useCallback(async (): Promise<void> => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }, []);

  const toggleFullscreen = useCallback(async (): Promise<void> => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await getTarget().requestFullscreen();
    }
  }, [getTarget]);

  return {
    isFullscreen,
    toggleFullscreen,
    requestFullscreen,
    exitFullscreen,
  };
};
