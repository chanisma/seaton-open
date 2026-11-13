import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FocusForestData,
  DEFAULT_FOCUS_FOREST_DATA,
  DEFAULT_ANIMAL_COLLECTION,
  AnimalType,
  CompletedForest,
  DailyRecord,
  TreePosition,
} from '@/types/focusForest.types';
import {
  getFocusForestData,
  upsertFocusForestData,
  saveCompletedForest as saveCompletedForestApi,
  saveSession as saveSessionApi,
} from '@/services/focusForest.service';
import { useAuth } from '@hooks/useAuth';

const SAVE_DEBOUNCE_MS = 3000; // debounce saves to avoid excessive writes

export const useFocusForestData = () => {
  const { user } = useAuth();
  const userId = user?.profile_id ?? null;
  const [data, setData] = useState<FocusForestData>({ ...DEFAULT_FOCUS_FOREST_DATA });
  const [isLoaded, setIsLoaded] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  // Load from Supabase on mount / user change
  useEffect(() => {
    if (!userId) {
      setData({ ...DEFAULT_FOCUS_FOREST_DATA });
      setIsLoaded(true);
      return;
    }

    let cancelled = false;
    (async () => {
      const loaded = await getFocusForestData(userId);
      if (cancelled) return;

      if (loaded) {
        // Merge animal collection with defaults (handle new animal types)
        const mergedCollection = {
          ...DEFAULT_ANIMAL_COLLECTION,
          ...loaded.animalCollection,
        };
        // Remove old types
        for (const key of Object.keys(mergedCollection)) {
          if (!(key in DEFAULT_ANIMAL_COLLECTION)) {
            delete (mergedCollection as Record<string, unknown>)[key];
          }
        }
        setData({
          ...loaded,
          animalCollection: mergedCollection,
          savedTrees: loaded.savedTrees ?? [],
          sessionGoalMinutes: loaded.sessionGoalMinutes ?? null,
        });
      }
      setIsLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Debounced save to Supabase
  const scheduleSave = useCallback(() => {
    if (!userId || !isLoaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      upsertFocusForestData(userId, dataRef.current);
    }, SAVE_DEBOUNCE_MS);
  }, [userId, isLoaded]);

  // Save on unmount / page close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (userId && isLoaded) {
        // Synchronous save attempt via sendBeacon
        const payload = JSON.stringify(dataRef.current);
        // Fallback: just clear the timer and save immediately
        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
          upsertFocusForestData(userId, dataRef.current);
        }
        void payload; // sendBeacon not available for Supabase, fire-and-forget
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        if (userId && isLoaded) {
          upsertFocusForestData(userId, dataRef.current);
        }
      }
    };
  }, [userId, isLoaded]);

  const totalFocusHours = data.totalFocusSeconds / 3600;

  const getTodayDateString = (): string => new Date().toISOString().slice(0, 10);

  const addSessionTime = useCallback(
    (seconds: number) => {
      if (seconds <= 0) return;
      const today = getTodayDateString();
      setData(prev => {
        const existingIdx = prev.dailyRecords.findIndex(r => r.date === today);
        let dailyRecords: DailyRecord[];
        if (existingIdx >= 0) {
          dailyRecords = prev.dailyRecords.map((r, i) =>
            i === existingIdx ? { ...r, focusSeconds: r.focusSeconds + seconds } : r
          );
        } else {
          dailyRecords = [
            ...prev.dailyRecords,
            { date: today, focusSeconds: seconds, treesGrown: 0 },
          ];
        }
        return {
          ...prev,
          totalFocusSeconds: prev.totalFocusSeconds + seconds,
          dailyRecords,
        };
      });
      scheduleSave();
    },
    [scheduleSave]
  );

  const updateLongestSession = useCallback(
    (seconds: number) => {
      setData(prev => {
        if (seconds <= prev.longestSessionSeconds) return prev;
        return { ...prev, longestSessionSeconds: seconds };
      });
      scheduleSave();
    },
    [scheduleSave]
  );

  const completeForest = useCallback(
    (forest: CompletedForest) => {
      setData(prev => ({
        ...prev,
        forests: [...prev.forests, forest],
      }));
      // Save completed forest to its own table
      if (userId) {
        saveCompletedForestApi(userId, forest);
      }
      scheduleSave();
    },
    [userId, scheduleSave]
  );

  const incrementForestIndex = useCallback(() => {
    setData(prev => ({ ...prev, currentForestIndex: prev.currentForestIndex + 1 }));
    scheduleSave();
  }, [scheduleSave]);

  const discoverAnimal = useCallback(
    (type: AnimalType): boolean => {
      let isNew = false;
      setData(prev => {
        const current = prev.animalCollection[type];
        if (!current) return prev;
        if (!current.discovered) {
          isNew = true;
          return {
            ...prev,
            animalCollection: {
              ...prev.animalCollection,
              [type]: {
                discovered: true,
                firstSeenAt: new Date().toISOString(),
                totalSeen: current.totalSeen + 1,
              },
            },
          };
        }
        return {
          ...prev,
          animalCollection: {
            ...prev.animalCollection,
            [type]: { ...current, totalSeen: current.totalSeen + 1 },
          },
        };
      });
      scheduleSave();
      return isNew;
    },
    [scheduleSave]
  );

  const getTodayRecord = useCallback((): DailyRecord | undefined => {
    const today = getTodayDateString();
    return data.dailyRecords.find(r => r.date === today);
  }, [data.dailyRecords]);

  const getRecentRecords = useCallback(
    (days: number): DailyRecord[] => {
      const result: DailyRecord[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const found = data.dailyRecords.find(r => r.date === dateStr);
        result.push(found ?? { date: dateStr, focusSeconds: 0, treesGrown: 0 });
      }
      return result;
    },
    [data.dailyRecords]
  );

  const addTreeToday = useCallback(() => {
    const today = getTodayDateString();
    setData(prev => {
      const existingIdx = prev.dailyRecords.findIndex(r => r.date === today);
      let dailyRecords: DailyRecord[];
      if (existingIdx >= 0) {
        dailyRecords = prev.dailyRecords.map((r, i) =>
          i === existingIdx ? { ...r, treesGrown: r.treesGrown + 1 } : r
        );
      } else {
        dailyRecords = [...prev.dailyRecords, { date: today, focusSeconds: 0, treesGrown: 1 }];
      }
      return { ...prev, dailyRecords };
    });
    scheduleSave();
  }, [scheduleSave]);

  const saveSession = useCallback(
    (startedAt: string, endedAt: string, durationSeconds: number, treesPlanted: number) => {
      if (userId) {
        saveSessionApi(userId, startedAt, endedAt, durationSeconds, treesPlanted);
      }
    },
    [userId]
  );

  const saveTrees = useCallback(
    (trees: TreePosition[]) => {
      setData(prev => ({ ...prev, savedTrees: trees }));
      scheduleSave();
    },
    [scheduleSave]
  );

  const setSessionGoalMinutes = useCallback(
    (minutes: number | null) => {
      setData(prev => ({ ...prev, sessionGoalMinutes: minutes }));
      scheduleSave();
    },
    [scheduleSave]
  );

  const incrementGoalSessions = useCallback(() => {
    const today = getTodayDateString();
    setData(prev => {
      const existingIdx = prev.dailyRecords.findIndex(r => r.date === today);
      let dailyRecords: DailyRecord[];
      if (existingIdx >= 0) {
        dailyRecords = prev.dailyRecords.map((r, i) =>
          i === existingIdx
            ? { ...r, goalSessionsCompleted: (r.goalSessionsCompleted ?? 0) + 1 }
            : r
        );
      } else {
        dailyRecords = [
          ...prev.dailyRecords,
          { date: today, focusSeconds: 0, treesGrown: 0, goalSessionsCompleted: 1 },
        ];
      }
      return { ...prev, dailyRecords };
    });
    scheduleSave();
  }, [scheduleSave]);

  return {
    data,
    isLoaded,
    totalFocusHours,
    addSessionTime,
    updateLongestSession,
    completeForest,
    incrementForestIndex,
    discoverAnimal,
    getTodayRecord,
    getRecentRecords,
    addTreeToday,
    saveTrees,
    saveSession,
    setSessionGoalMinutes,
    incrementGoalSessions,
  };
};
