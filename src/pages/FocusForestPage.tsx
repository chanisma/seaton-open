// FocusForestPage - Focus Forest 진입점 (시작 화면 + 전체화면 집중 모드)
// 방해 최소화: 세션 중 토스트/모달 없음. 보상은 세션 종료 요약(SessionSummary)에서.

import { useState, useEffect, useRef, useCallback } from 'react';
import { BarChart2, BookOpen, Eye, Map as MapIcon, Play, UsersRound } from 'lucide-react';

import { Layout } from '@components/common/Layout';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { Select } from '@components/common/Select';
import { AnimalCollection } from '@components/focus-forest/AnimalCollection';
import { FocusHud } from '@components/focus-forest/FocusHud';
import { FocusOverlay } from '@components/focus-forest/FocusOverlay';
import { FocusStatistics } from '@components/focus-forest/FocusStatistics';
import { ForestMap } from '@components/focus-forest/ForestMap';
import { MiniForest3D } from '@components/focus-forest/scene/MiniForest3D';
import { ForestScene } from '@components/focus-forest/scene/ForestScene';
import { SessionSummary, type SessionSummaryData } from '@components/focus-forest/SessionSummary';
import { FOREST_COMPLETE_COUNT } from '@components/focus-forest/useForestSimulation';
import type { AnimalType, FocusForestData, TreePosition } from '@/types/focusForest.types';
import { ANIMAL_CONFIGS } from '@/types/focusForest.types';
import { useAuth } from '@hooks/useAuth';
import { useFocusForestData } from '@hooks/useFocusForestData';
import { useFocusMode } from '@hooks/useFocusMode';
import {
  finishFocusRun,
  getFocusForestData,
  getFocusForestParticipants,
  startFocusRun,
  type FocusForestParticipant,
} from '@/services/focusForest.service';
import { getWallet } from '@/services/points.service';
import {
  FOCUS_COIN_AMOUNT,
  FOCUS_COIN_MINUTES,
  focusRewardMessage,
  type FocusFinishResult,
} from '@utils/wallet';

const SPEED_OPTIONS = [1, 2, 5, 10, 30, 60] as const;

const GOAL_OPTIONS: { label: string; value: number | null }[] = [
  { label: '25분', value: 25 },
  { label: '50분', value: 50 },
  { label: '90분', value: 90 },
  { label: '무제한', value: null },
];

type ModalType = 'forest-map' | 'animal-collection' | 'statistics' | null;

const ROLE_LABEL = {
  student: '학생',
  teacher: '교사',
  admin: '관리자',
} as const;

export const FocusForestPage = () => {
  const { isAdmin, user } = useAuth();
  const [speed, setSpeed] = useState(1);

  const {
    isFocusing,
    isPaused,
    elapsedSeconds,
    formattedTime,
    isFullscreen,
    toggleFullscreen,
    reset,
    containerRef,
  } = useFocusMode(speed);

  const {
    data,
    isLoaded,
    addSessionTime,
    updateLongestSession,
    discoverAnimal,
    addTreeToday,
    saveTrees,
    completeForest,
    incrementForestIndex,
    saveSession,
    setSessionGoalMinutes,
    incrementGoalSessions,
    getTodayRecord,
  } = useFocusForestData();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [treeCount, setTreeCount] = useState(data.savedTrees?.length ?? 0);
  const [summary, setSummary] = useState<SessionSummaryData | null>(null);
  const [goalCardVisible, setGoalCardVisible] = useState(false);
  const [participants, setParticipants] = useState<FocusForestParticipant[]>([]);
  const [selectedViewerId, setSelectedViewerId] = useState('');
  const [viewedData, setViewedData] = useState<FocusForestData | null>(null);
  const [isParticipantsLoading, setIsParticipantsLoading] = useState(false);
  const [isViewedDataLoading, setIsViewedDataLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(null);
  const [viewedDataError, setViewedDataError] = useState<string | null>(null);

  const goalMinutes = data.sessionGoalMinutes;
  const goalSessionsToday = getTodayRecord()?.goalSessionsCompleted ?? 0;

  // ---- 집중 코인 (서버가 시간을 잰다 — 학생 · 25/50/90분 목표만) ----
  const isStudent = user?.type === 'student';
  const [focusReward, setFocusReward] = useState<string | null>(null);
  const [focusLeft, setFocusLeft] = useState<number | null>(null);
  const focusRunRef = useRef<{ id: string; settled: boolean; pending: boolean } | null>(null);
  const focusStartRef = useRef<Promise<void> | null>(null);
  const focusRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusRewardRef = useRef<string | null>(null);
  const isFullscreenRef = useRef(false);

  useEffect(() => {
    if (!isStudent) return;
    getWallet().then(wallet => {
      if (wallet) setFocusLeft(wallet.focusLeft);
    });
  }, [isStudent]);

  useEffect(
    () => () => {
      if (focusRetryRef.current) clearTimeout(focusRetryRef.current);
    },
    []
  );

  const isCoinGoal = (minutes: number | null): minutes is number =>
    minutes !== null && (FOCUS_COIN_MINUTES as readonly number[]).includes(minutes);

  /** 목표 세션 시작 → 서버 기록 id 보관 (교사·관리자·무제한은 부르지 않는다) */
  const beginFocusRun = useCallback(
    (minutes: number | null) => {
      focusRunRef.current = null;
      focusRewardRef.current = null;
      setFocusReward(null);
      if (focusRetryRef.current) {
        clearTimeout(focusRetryRef.current);
        focusRetryRef.current = null;
      }
      if (!isStudent || !isCoinGoal(minutes)) {
        focusStartRef.current = null;
        return;
      }
      focusStartRef.current = startFocusRun(minutes)
        .then(run => {
          focusRunRef.current = { id: run.id, settled: false, pending: false };
        })
        .catch(error => {
          // 코인을 못 받을 뿐 집중은 그대로 할 수 있다
          console.error('Failed to start focus run:', error);
        });
    },
    [isStudent]
  );

  const applyFocusResult = useCallback((result: FocusFinishResult) => {
    const message = focusRewardMessage(result);
    focusRewardRef.current = message;
    setFocusReward(message);
    setSummary(prev => (prev ? { ...prev, coinMessage: message } : prev));
    if (result.outcome === 'completed') {
      getWallet().then(wallet => {
        if (wallet) setFocusLeft(wallet.focusLeft);
      });
    }
  }, []);

  /**
   * 목표 세션 끝내기.
   * - goal: 목표 시간 도달 — 서버 시계로 아직이면('running') 남은 초 뒤에 다시 묻는다
   * - exit: 집중 화면을 나감 — 아직 'running' 이면 포기로 닫는다(코인 없음)
   */
  const settleFocusRunRef = useRef<(mode: 'goal' | 'exit') => Promise<void>>(async () => {});
  settleFocusRunRef.current = async (mode: 'goal' | 'exit') => {
    if (focusStartRef.current) await focusStartRef.current;
    const run = focusRunRef.current;
    if (!run || run.settled || run.pending) return;
    if (focusRetryRef.current) {
      clearTimeout(focusRetryRef.current);
      focusRetryRef.current = null;
    }
    run.pending = true;
    try {
      let result = await finishFocusRun(run.id, false);
      if (result.outcome === 'running') {
        if (mode === 'goal') {
          run.pending = false;
          const waitMs = ((result.remaining ?? 1) + 1) * 1000;
          focusRetryRef.current = setTimeout(() => {
            void settleFocusRunRef.current(isFullscreenRef.current ? 'goal' : 'exit');
          }, waitMs);
          return;
        }
        result = await finishFocusRun(run.id, true);
      }
      run.settled = true;
      applyFocusResult(result);
    } catch (error) {
      console.error('Failed to finish focus run:', error);
    } finally {
      run.pending = false;
    }
  };

  useEffect(() => {
    if (!isAdmin || !user?.profile_id) {
      setParticipants([]);
      setSelectedViewerId('');
      return;
    }

    let cancelled = false;
    setIsParticipantsLoading(true);
    setParticipantsError(null);

    getFocusForestParticipants(user.profile_id)
      .then(result => {
        if (!cancelled) setParticipants(result);
      })
      .catch(error => {
        if (!cancelled) {
          setParticipantsError(
            error instanceof Error ? error.message : '사용자 목록을 불러오지 못했습니다.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsParticipantsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, user?.profile_id]);

  useEffect(() => {
    if (!isAdmin || !selectedViewerId) {
      setViewedData(null);
      setViewedDataError(null);
      setIsViewedDataLoading(false);
      return;
    }

    let cancelled = false;
    setViewedData(null);
    setViewedDataError(null);
    setIsViewedDataLoading(true);

    getFocusForestData(selectedViewerId)
      .then(result => {
        if (cancelled) return;
        if (!result) {
          setViewedDataError('선택한 사용자의 집중 데이터를 찾지 못했습니다.');
          return;
        }
        setViewedData(result);
      })
      .catch(error => {
        if (!cancelled) {
          setViewedDataError(
            error instanceof Error ? error.message : '집중 데이터를 불러오지 못했습니다.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsViewedDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, selectedViewerId]);

  // ---- 세션 추적 (리렌더 불필요 → ref) ----
  const sessionAnimalsRef = useRef(new Map<AnimalType, boolean>()); // type → isNew
  const sessionForestsRef = useRef(0);
  const goalReachedRef = useRef(false);
  const prevIsFullscreenRef = useRef(isFullscreen);
  const sessionStartRef = useRef<string | null>(null);
  const sessionPlantsRef = useRef(0);
  const prevTreesLenRef = useRef<number | null>(null);

  // ---- 목표 달성 감지 → 골든아워 + 카드 ----
  useEffect(() => {
    if (!isFullscreen || goalMinutes === null || goalReachedRef.current) return;
    if (elapsedSeconds >= goalMinutes * 60) {
      goalReachedRef.current = true;
      setGoalCardVisible(true);
      incrementGoalSessions();
      void settleFocusRunRef.current('goal');
    }
  }, [elapsedSeconds, isFullscreen, goalMinutes, incrementGoalSessions]);

  // ---- 전체화면 진입: 세션 추적 초기화 / 종료: 저장 + 요약 표시 ----
  useEffect(() => {
    const wasFullscreen = prevIsFullscreenRef.current;
    prevIsFullscreenRef.current = isFullscreen;
    isFullscreenRef.current = isFullscreen;

    if (isFullscreen && !wasFullscreen) {
      sessionStartRef.current = new Date().toISOString();
      sessionAnimalsRef.current = new Map();
      sessionForestsRef.current = 0;
      sessionPlantsRef.current = 0;
      goalReachedRef.current = false;
      setGoalCardVisible(false);
      beginFocusRun(goalMinutes);
    }

    if (!isFullscreen && wasFullscreen) {
      void settleFocusRunRef.current('exit');
      if (elapsedSeconds >= 5) {
        const endedAt = new Date().toISOString();
        const treesPlanted = sessionPlantsRef.current;

        addSessionTime(elapsedSeconds);
        updateLongestSession(elapsedSeconds);
        saveSession(sessionStartRef.current ?? endedAt, endedAt, elapsedSeconds, treesPlanted);

        setSummary({
          durationSeconds: elapsedSeconds,
          treesPlanted,
          animalsSeen: Array.from(sessionAnimalsRef.current, ([type, isNew]) => ({
            type,
            isNew,
          })),
          forestsCompleted: sessionForestsRef.current,
          forestProgressCount: treeCount,
          goalReached: goalReachedRef.current,
          goalMinutes,
          coinMessage: focusRewardRef.current,
        });
        setGoalCardVisible(false);
      }
      prevTreesLenRef.current = null;
      reset();
    }
  }, [
    isFullscreen,
    elapsedSeconds,
    addSessionTime,
    updateLongestSession,
    reset,
    saveSession,
    treeCount,
    goalMinutes,
    beginFocusRun,
  ]);

  // ---- 동물 등장: 도감 기록 + 세션 추적만 (세션 중 알림 없음) ----
  const handleAnimalAppear = useCallback(
    (type: AnimalType) => {
      const wasNew = discoverAnimal(type);
      const prevIsNew = sessionAnimalsRef.current.get(type);
      sessionAnimalsRef.current.set(type, prevIsNew === true || wasNew);
    },
    [discoverAnimal]
  );

  // ---- 숲 완성: 저장/전환은 즉시, 축하는 요약에서 ----
  const handleForestComplete = useCallback(
    (forestIndex: number) => {
      completeForest({
        id: forestIndex,
        completedAt: new Date().toISOString(),
        totalTrees: FOREST_COMPLETE_COUNT,
        focusTimeSeconds: elapsedSeconds,
        treePositions: data.savedTrees ?? [],
      });
      incrementForestIndex();
      saveTrees([]);
      addTreeToday();
      setTreeCount(0);
      sessionForestsRef.current += 1;
    },
    [addTreeToday, completeForest, incrementForestIndex, saveTrees, elapsedSeconds, data.savedTrees]
  );

  const handleTreesChange = useCallback(
    (trees: TreePosition[]) => {
      const prev = prevTreesLenRef.current;
      if (prev !== null && trees.length > prev) {
        sessionPlantsRef.current += trees.length - prev;
      }
      prevTreesLenRef.current = trees.length;
      saveTrees(trees);
    },
    [saveTrees]
  );

  const closeModal = useCallback(() => setActiveModal(null), []);

  const isViewingOtherUser = isAdmin && selectedViewerId.length > 0;
  const selectedParticipant = participants.find(participant => participant.id === selectedViewerId);
  const visibleData = isViewingOtherUser ? viewedData : data;
  const displayData = visibleData ?? data;
  const visibleFocusHours = displayData.totalFocusSeconds / 3600;
  const discoveredCount = Object.values(displayData.animalCollection).filter(
    animal => animal.discovered
  ).length;
  const totalAnimals = ANIMAL_CONFIGS.length;
  const focusHoursDisplay = Math.floor(visibleFocusHours);
  const modalOwnerLabel = isViewingOtherUser
    ? `${selectedParticipant?.name ?? '선택한 사용자'}님의`
    : '나의';

  // --- 전체화면 집중 모드 ---
  if (isFullscreen) {
    return (
      <div ref={containerRef} className="relative w-screen h-screen overflow-hidden bg-black">
        <ForestScene
          elapsedSeconds={elapsedSeconds}
          isFocusing={isFocusing}
          currentForestIndex={data.currentForestIndex}
          goldenHour={goalCardVisible}
          savedTrees={data.savedTrees}
          onAnimalAppear={handleAnimalAppear}
          onForestComplete={handleForestComplete}
          onTreeCountChange={setTreeCount}
          onTreesChange={handleTreesChange}
        />

        <FocusHud
          formattedTime={formattedTime}
          forestIndex={data.currentForestIndex}
          treeCount={treeCount}
          goalMinutes={goalMinutes}
          elapsedSeconds={elapsedSeconds}
          goalSessionsToday={goalSessionsToday}
        />

        {/* 종료 버튼: 호버 시에만 표시 */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute right-4 top-4 z-20 rounded-xl bg-black/30 px-3 py-2
            text-sm text-white/80 opacity-100 backdrop-blur-sm transition-opacity duration-200
            hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
            md:opacity-0 md:hover:opacity-100 md:focus-visible:opacity-100"
        >
          전체화면 종료
        </button>

        {/* 관리자 배속 */}
        {isAdmin && (
          <div
            className="absolute top-4 left-4 z-20 flex items-center gap-1
            bg-black/40 backdrop-blur-sm rounded-xl px-2 py-1.5"
          >
            <span className="text-[10px] text-yellow-300 font-semibold mr-1">SPEED</span>
            {SPEED_OPTIONS.map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  speed === s
                    ? 'bg-yellow-400 text-black font-bold'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        )}

        {/* 목표 달성 카드 */}
        {goalCardVisible && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div
              className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-3xl
              px-8 py-8 flex flex-col items-center gap-4 text-center max-w-sm w-full mx-4"
            >
              <span className="text-5xl">🌅</span>
              <h2 className="text-2xl font-bold text-white">목표 달성!</h2>
              <p className="text-white/80 text-base leading-relaxed">
                {goalMinutes}분 집중을 해냈어요.
                <br />
                숲에 골든아워가 찾아왔어요.
              </p>
              {focusReward && (
                <p className="rounded-full bg-amber-400/20 px-3 py-1 text-sm font-semibold text-amber-100">
                  🪙 {focusReward}
                </p>
              )}
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={toggleFullscreen}
                  className="flex-1 bg-white/15 hover:bg-white/25 text-white
                    font-semibold rounded-2xl px-4 py-3 transition-colors duration-150"
                >
                  5분 쉬어가기
                </button>
                <button
                  onClick={() => setGoalCardVisible(false)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white
                    font-semibold rounded-2xl px-4 py-3 transition-colors duration-150"
                >
                  계속 집중하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 일시정지 오버레이 */}
        {isPaused && (
          <FocusOverlay
            sessionSeconds={elapsedSeconds}
            totalSeconds={data.totalFocusSeconds}
            onResume={toggleFullscreen}
          />
        )}
      </div>
    );
  }

  // --- 시작 화면 ---
  return (
    <Layout title="집중 모드">
      <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        <h1 className="sr-only">Focus Forest 집중 모드</h1>

        {isAdmin && (
          <section className="content-surface rounded-[2rem] p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <UsersRound className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-bold tracking-tight text-foreground">사용자 데이터 열람</h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    집중 기록이 있는 사용자를 선택해 읽기 전용으로 확인하세요.
                  </p>
                </div>
              </div>
              <Select
                aria-label="집중 데이터 사용자 선택"
                value={selectedViewerId}
                disabled={isParticipantsLoading}
                onChange={event => {
                  setSelectedViewerId(event.target.value);
                  setActiveModal(null);
                }}
                options={[
                  { value: '', label: '내 집중 데이터' },
                  ...participants.map(participant => ({
                    value: participant.id,
                    label: `${participant.name} · ${ROLE_LABEL[participant.role]} · ${Math.floor(
                      participant.totalFocusSeconds / 3600
                    )}시간`,
                  })),
                ]}
                className="w-full sm:w-80"
                fullWidth
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">
                {isParticipantsLoading
                  ? '사용자 목록을 불러오는 중…'
                  : `열람 가능한 사용자 ${participants.length}명`}
              </span>
              {isViewingOtherUser && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary">
                  <Eye className="h-3.5 w-3.5" />
                  읽기 전용
                </span>
              )}
            </div>
            {participantsError && (
              <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                {participantsError}
              </p>
            )}
          </section>
        )}

        {isViewingOtherUser && isViewedDataLoading ? (
          <div className="content-surface flex min-h-72 items-center justify-center rounded-[2rem]">
            <LoadingSpinner size="lg" />
          </div>
        ) : isViewingOtherUser && (viewedDataError || !viewedData) ? (
          <div className="content-surface flex min-h-72 flex-col items-center justify-center rounded-[2rem] px-5 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Eye className="h-6 w-6" />
            </span>
            <p className="mt-4 text-sm font-semibold text-foreground">
              집중 데이터를 표시할 수 없습니다.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{viewedDataError}</p>
          </div>
        ) : (
          <>
            <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.75fr)]">
              {/* 현재 숲 라이브 프리뷰 */}
              <section className="content-surface min-w-0 overflow-hidden rounded-[2rem] p-3 sm:p-4">
                <div className="relative overflow-hidden rounded-[1.4rem]">
                  <MiniForest3D
                    trees={displayData.savedTrees ?? []}
                    className="min-w-0 aspect-video w-full overflow-hidden"
                    fallback={
                      <div
                        className="flex h-full w-full items-center justify-center
                    bg-gradient-to-b from-sky-200 to-emerald-300 dark:from-sky-900 dark:to-emerald-900"
                      >
                        <span className="text-5xl">🌱</span>
                      </div>
                    }
                  />
                  <span
                    className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full
                bg-black/35 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm"
                  >
                    🌱 {displayData.currentForestIndex}번째 숲 · 나무{' '}
                    {displayData.savedTrees?.length ?? 0}그루
                  </span>
                </div>
                <div className="px-2 pb-1 pt-4">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">
                    {isViewingOtherUser
                      ? `${selectedParticipant?.name ?? '선택한 사용자'}님의 숲`
                      : '집중하는 동안 숲이 자라요'}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isViewingOtherUser
                      ? '현재 숲의 성장 상태와 저장된 나무를 확인하고 있어요.'
                      : '세션을 마치면 심은 나무와 만난 동물을 한 번에 확인할 수 있어요.'}
                  </p>
                </div>
              </section>

              <section className="content-surface flex min-w-0 flex-col rounded-[2rem] p-5 sm:p-6">
                {isViewingOtherUser ? (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-primary">관리자 열람</p>
                      <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
                        {selectedParticipant?.name ?? '선택한 사용자'}님의 집중 데이터
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        숲, 동물 도감과 세션 기록을 확인할 수 있습니다.
                      </p>
                    </div>
                    <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/[0.045] p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Eye className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">읽기 전용 화면</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            다른 사용자의 목표와 기록은 변경할 수 없으며 집중 세션도 시작되지
                            않습니다.
                          </p>
                        </div>
                      </div>
                    </div>
                    <dl className="mt-5 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-muted/55 p-3">
                        <dt className="text-xs text-muted-foreground">사용자 유형</dt>
                        <dd className="mt-1 text-sm font-bold text-foreground">
                          {selectedParticipant ? ROLE_LABEL[selectedParticipant.role] : '—'}
                        </dd>
                      </div>
                      <div className="rounded-2xl bg-muted/55 p-3">
                        <dt className="text-xs text-muted-foreground">마지막 저장</dt>
                        <dd className="mt-1 text-sm font-bold text-foreground">
                          {selectedParticipant?.updatedAt
                            ? new Intl.DateTimeFormat('ko-KR', {
                                month: 'numeric',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              }).format(new Date(selectedParticipant.updatedAt))
                            : '—'}
                        </dd>
                      </div>
                    </dl>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        오늘의 집중
                      </p>
                      <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground">
                        목표 시간을 선택하세요
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        목표를 달성하면 숲에 골든아워가 찾아와요.
                      </p>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-muted/70 p-1">
                      {GOAL_OPTIONS.map(option => (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => setSessionGoalMinutes(option.value)}
                          disabled={!isLoaded}
                          aria-pressed={goalMinutes === option.value}
                          className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition-[color,background-color,box-shadow] ${
                            goalMinutes === option.value
                              ? 'bg-card text-foreground shadow-card'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      {goalMinutes !== null
                        ? `${goalMinutes}분 뒤 목표 달성 화면을 보여드려요.`
                        : '시간 제한 없이 자유롭게 집중할 수 있어요. 무제한은 코인이 없어요.'}
                    </p>
                    {isStudent && isCoinGoal(goalMinutes) && (
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        끝까지 집중하면 +{FOCUS_COIN_AMOUNT}코인 (다마고찌 «함께 집중»과 합쳐 하루
                        2번
                        {focusLeft !== null ? ` · 오늘 ${focusLeft}번 남음` : ''})
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      disabled={!isLoaded}
                      className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl
                    bg-emerald-500 px-6 py-3.5 text-base font-semibold text-white
                    shadow-lg shadow-emerald-500/20 transition-colors duration-150 hover:bg-emerald-600
                    active:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-emerald-400 focus-visible:ring-offset-2
                    disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Play size={19} className="fill-current" />
                      집중 시작하기
                    </button>

                    {isAdmin && (
                      <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] p-3">
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                          관리자 배속
                        </span>
                        <div className="mt-2 grid grid-cols-6 gap-1">
                          {SPEED_OPTIONS.map(option => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => setSpeed(option)}
                              className={`rounded-lg px-1 py-1.5 text-xs transition-colors ${
                                speed === option
                                  ? 'bg-amber-400 font-bold text-black'
                                  : 'text-amber-700 hover:bg-amber-500/10 dark:text-amber-300'
                              }`}
                            >
                              {option}x
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>

            {/* 통계 3카드 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="content-surface flex min-w-0 flex-col rounded-[1.5rem] p-4 sm:p-5">
                <span className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                  {focusHoursDisplay}시간
                </span>
                <span className="mt-1 text-xs text-muted-foreground">총 집중 시간</span>
              </div>
              <div className="content-surface flex min-w-0 flex-col rounded-[1.5rem] p-4 sm:p-5">
                <span className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                  {displayData.forests.length}개
                </span>
                <span className="mt-1 text-xs text-muted-foreground">완성한 숲</span>
              </div>
              <div className="content-surface flex min-w-0 flex-col rounded-[1.5rem] p-4 sm:p-5">
                <span className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">
                  {discoveredCount}/{totalAnimals}종
                </span>
                <span className="mt-1 text-xs text-muted-foreground">발견한 동물</span>
              </div>
            </div>

            {/* 네비게이션 */}
            <section className="content-surface rounded-[2rem] p-4 sm:p-5">
              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('forest-map')}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border
                border-border/60 bg-background/60 px-4 text-sm font-semibold text-foreground
                transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <MapIcon size={17} />
                  {isViewingOtherUser ? '숲 목록' : '나의 숲 목록'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('animal-collection')}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border
                border-border/60 bg-background/60 px-4 text-sm font-semibold text-foreground
                transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <BookOpen size={17} />
                  동물 도감
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('statistics')}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border
                border-border/60 bg-background/60 px-4 text-sm font-semibold text-foreground
                transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  <BarChart2 size={17} />
                  집중 기록
                </button>
              </div>
              <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
                {isViewingOtherUser
                  ? '다른 사용자의 데이터는 조회만 가능하며 수정되지 않습니다.'
                  : '다른 탭으로 이동하거나 전체화면을 종료하면 타이머가 일시정지됩니다.'}
              </p>
            </section>
          </>
        )}
      </div>

      {/* 모달 */}
      {activeModal === 'forest-map' && (
        <ForestMap
          forests={displayData.forests}
          currentForestIndex={displayData.currentForestIndex}
          onClose={closeModal}
          title={`${modalOwnerLabel} 숲 목록`}
        />
      )}
      {activeModal === 'animal-collection' && (
        <AnimalCollection
          collection={displayData.animalCollection}
          totalFocusHours={visibleFocusHours}
          onClose={closeModal}
          title={`${modalOwnerLabel} 동물 도감`}
        />
      )}
      {activeModal === 'statistics' && (
        <FocusStatistics
          data={displayData}
          onClose={closeModal}
          userId={isViewingOtherUser ? selectedViewerId : undefined}
          readOnly={isViewingOtherUser}
          title={`${modalOwnerLabel} 집중 기록`}
        />
      )}

      {/* 세션 종료 요약 */}
      {summary && <SessionSummary summary={summary} onClose={() => setSummary(null)} />}
    </Layout>
  );
};
