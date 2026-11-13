import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@hooks/useAuth';
import { Layout } from '@components/common/Layout';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { Button } from '@components/common/Button';
import { ToastContainer } from '@components/common/Toast';
import { AccessibleChart } from '@components/common/AccessibleChart';
import { StatCard } from '@components/common/StatCard';
import { EmptyState } from '@components/common/EmptyState';
import { Badge, attendanceRateTone } from '@components/common/Badge';
import { StatisticsFilterBar } from '@components/statistics/StatisticsFilterBar';
import { DailyAttendanceMatrix } from '@components/statistics/DailyAttendanceMatrix';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  DoorOpen,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { useToast } from '@hooks/useToast';
import { useChartTheme } from '@hooks/useChartTheme';
import {
  getOverallStatistics,
  getGradeStatistics,
  getMonthlyStatistics,
  getWeeklyStatistics,
  getRoomStatistics,
  getStudentStatsBundle,
  type OverallStatistics,
  type GradeStatistics,
  type MonthlyStatistics,
  type WeeklyStatistics,
  type RoomStatistics,
  type StudentStatistics,
  type StudentDailyAttendance,
  parseAttendanceCSV,
  bulkUpdateAttendance,
  type AttendanceUpdateResult,
  getWeekdayCrosstab,
  type WeekdayCrosstab,
} from '@services/statistics.service';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { downloadCSV, downloadExcel } from '@utils/download';
import { rowsToCSV } from '@utils/csv';
import {
  buildAttendanceMatrix,
  buildAttendanceSheets,
  getDaysWithData,
} from '@utils/attendanceExport';
import { formatRoomSessions } from '@utils/roomSession';
import {
  buildWeekOptions,
  createDefaultStatisticsFilters,
  serializeStatisticsFilters,
  validateDateRange,
  type StatisticsFilters,
} from '@utils/statisticsFilters';
import { WeekdayTabContent } from '@components/teacher/WeekdayTabContent';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 출석률에 따른 텍스트 색상 클래스를 반환합니다. (툴팁 내부용)
 * 배지는 공용 Badge + attendanceRateTone을 사용합니다.
 */
function getAttendanceRateTextColor(rate: number): string {
  if (rate >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (rate >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

/** 차트를 표로 전환했을 때 보여줄 컬럼 정의 (AccessibleChart) */
const GRADE_CHART_COLUMNS = [
  { key: 'grade', label: '학년', format: (value: any) => `${value}학년` },
  { key: 'totalReservations', label: '총 신청' },
  { key: 'attended', label: '출석' },
  { key: 'attendanceRate', label: '출석률', format: (value: any) => `${value}%` },
];

const PIE_CHART_COLUMNS = [
  { key: 'name', label: '구분' },
  { key: 'value', label: '건수' },
];

// ============================================================================
// Component
// ============================================================================

/**
 * 차트 애니메이션 길이 (ms). Recharts 기본값(1500ms)은 필터를 바꿀 때마다 다시 재생되어
 * 데이터가 이미 도착했는데도 기다리는 것처럼 느껴집니다.
 */
const CHART_ANIMATION_MS = 300;

/** 이전 데이터를 보여주는 동안 새 데이터를 불러오고 있음을 알리는 표시 */
const RefreshingHint = () => (
  <div
    className="mb-3 flex items-center justify-end gap-2 text-xs text-muted-foreground"
    role="status"
  >
    <LoadingSpinner size="sm" />
    최신 데이터를 불러오는 중…
  </div>
);

/** 다시 불러오는 동안 기존 내용을 흐리게 유지 (첫 로딩에만 전체 스피너) */
const refreshingClass = (isRefreshing: boolean) =>
  `transition-opacity duration-200 ${isRefreshing ? 'opacity-60' : 'opacity-100'}`;

/** 1초 이상 로딩 시에만 스피너 표시 */
function useDelayedLoading(isLoading: boolean, delay = 1000): boolean {
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoading) {
      timerRef.current = setTimeout(() => setShow(true), delay);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShow(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, delay]);

  return show;
}

export const StatisticsDashboardPage = () => {
  const { user } = useAuth();
  const { toasts, removeToast, warning: showWarning } = useToast();
  const chartTheme = useChartTheme();

  // 적용된 필터(데이터 페치 트리거)와 편집 중인 필터를 분리합니다.
  const [filters, setFilters] = useState<StatisticsFilters>(createDefaultStatisticsFilters);
  const [draftFilters, setDraftFilters] = useState<StatisticsFilters>(
    createDefaultStatisticsFilters
  );
  const { startDate, endDate, grade: selectedGrade, roomId: selectedRoom, includeFuture } = filters;

  const [error, setError] = useState<string | null>(null);

  // 통계 데이터
  const [overallStats, setOverallStats] = useState<OverallStatistics | null>(null);
  const [roomScopedStats, setRoomScopedStats] = useState<OverallStatistics | null>(null);
  const [gradeStats, setGradeStats] = useState<GradeStatistics[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatistics[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatistics[]>([]);
  const [roomStats, setRoomStats] = useState<RoomStatistics[]>([]);
  const [weekdayCrosstab, setWeekdayCrosstab] = useState<WeekdayCrosstab[]>([]);
  const [crosstabWeek, setCrosstabWeek] = useState<Date | null>(null); // null = 전체 기간
  const [isCrosstabLoading, setIsCrosstabLoading] = useState(false);
  const [roomStatsWeek, setRoomStatsWeek] = useState<Date | null>(null);
  const [isRoomStatsWeekLoading, setIsRoomStatsWeekLoading] = useState(false);
  const [weeklyRoomStats, setWeeklyRoomStats] = useState<RoomStatistics[] | null>(null);
  const showRoomStatsSpinner = useDelayedLoading(isRoomStatsWeekLoading);
  const showCrosstabSpinner = useDelayedLoading(isCrosstabLoading);
  const [studentStats, setStudentStats] = useState<StudentStatistics[]>([]);
  const [dailyAttendanceStats, setDailyAttendanceStats] = useState<StudentDailyAttendance[]>([]);

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'weekday'>('overview');

  // 추이 차트 모드 (월별/주별)
  const [trendMode, setTrendMode] = useState<'monthly' | 'weekly'>('weekly');

  // 차트 필터링 상태 (overall, grade1, grade2, grade3)
  const [selectedSeries, setSelectedSeries] = useState<string[]>(['overall']);

  // 개별 로딩 상태
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);
  const [isRoomScopedLoading, setIsRoomScopedLoading] = useState(false);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);

  // CSV 불러오기 상태
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<AttendanceUpdateResult | null>(null);

  const applyFilters = useCallback(() => {
    if (validateDateRange(draftFilters.startDate, draftFilters.endDate)) return;
    setFilters(draftFilters);
  }, [draftFilters]);

  // ==========================================================================
  // 데이터 로딩
  // 모든 effect는 취소 가드를 둡니다. 필터를 빠르게 바꿀 때 늦게 도착한 이전 응답이
  // 최신 결과를 덮어쓰면 표와 차트의 기간이 서로 어긋나기 때문입니다.
  // ==========================================================================

  // 열람실 목록 — 필터 드롭다운이 항상 현재 기간을 반영하도록 탭과 무관하게 로드
  useEffect(() => {
    let cancelled = false;

    getRoomStatistics(startDate, endDate, selectedGrade, includeFuture)
      .then(data => {
        if (!cancelled) setRoomStats(data);
      })
      .catch(err => {
        if (!cancelled) console.error('Failed to load room statistics:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, selectedGrade, includeFuture]);

  // Overview 통계
  useEffect(() => {
    if (activeTab !== 'overview') return;
    let cancelled = false;

    const loadOverviewStats = async () => {
      try {
        setIsOverviewLoading(true);
        setError(null);

        // 월별 추이용 별도 기간 (현재 기준 최근 6개월)
        const trendEnd = endOfMonth(new Date());
        const trendStart = startOfMonth(subMonths(new Date(), 5));

        // 주별 추이용 별도 기간 (현재 기준 최근 12주)
        const weeklyTrendEnd = new Date();
        const weeklyTrendStart = new Date();
        weeklyTrendStart.setDate(weeklyTrendStart.getDate() - 12 * 7);

        const [overall, grade, monthly, weekly] = await Promise.all([
          getOverallStatistics(startDate, endDate, selectedGrade, includeFuture),
          getGradeStatistics(startDate, endDate, selectedGrade, includeFuture),
          getMonthlyStatistics(trendStart, trendEnd, selectedGrade, includeFuture),
          getWeeklyStatistics(weeklyTrendStart, weeklyTrendEnd, selectedGrade, includeFuture),
        ]);

        if (cancelled) return;

        setOverallStats(overall);
        setGradeStats(grade);
        setMonthlyStats(monthly);
        setWeeklyStats(weekly);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '통계를 불러오는데 실패했습니다.');
        }
      } finally {
        if (!cancelled) setIsOverviewLoading(false);
      }
    };

    loadOverviewStats();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, selectedGrade, includeFuture, activeTab]);

  // 열람실 필터가 걸린 요약 카드
  // get_room_statistics는 총 신청/출석만 주므로, 결석(경과분만)과 이용 학생 수는
  // 학생 번들에서 계산합니다. 단순 뺄셈을 쓰면 미래 예약이 결석으로 잡힙니다.
  useEffect(() => {
    if (activeTab !== 'overview' || !selectedRoom) {
      setRoomScopedStats(null);
      setIsRoomScopedLoading(false);
      return;
    }
    let cancelled = false;

    const loadRoomScoped = async () => {
      try {
        setIsRoomScopedLoading(true);
        const { statistics } = await getStudentStatsBundle(
          startDate,
          endDate,
          selectedGrade,
          includeFuture,
          selectedRoom
        );
        if (cancelled) return;

        const totals = statistics.reduce(
          (acc, stat) => ({
            totalReservations: acc.totalReservations + stat.totalReservations,
            totalAttended: acc.totalAttended + stat.attended,
            totalAbsent: acc.totalAbsent + stat.absent,
          }),
          { totalReservations: 0, totalAttended: 0, totalAbsent: 0 }
        );

        // get_overall_statistics와 동일하게 분모는 '출석 + 결석'입니다.
        // (아직 지나지 않은 예약은 출석률 계산에서 제외)
        const settled = totals.totalAttended + totals.totalAbsent;

        setRoomScopedStats({
          ...totals,
          overallAttendanceRate:
            settled > 0 ? Math.round((totals.totalAttended / settled) * 100) : 0,
          uniqueStudents: statistics.length,
          activeRooms: 1,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '열람실 통계를 불러오는데 실패했습니다.');
        }
      } finally {
        if (!cancelled) setIsRoomScopedLoading(false);
      }
    };

    loadRoomScoped();

    return () => {
      cancelled = true;
    };
  }, [activeTab, selectedRoom, startDate, endDate, selectedGrade, includeFuture]);

  // 요일별 교차표 — 주 선택 여부에 따라 조회 기간만 달라집니다.
  useEffect(() => {
    if (activeTab !== 'weekday') return;
    let cancelled = false;

    const load = async () => {
      setIsCrosstabLoading(true);
      try {
        const rangeStart = crosstabWeek
          ? startOfWeek(crosstabWeek, { weekStartsOn: 1 })
          : startDate;
        const rangeEnd = crosstabWeek ? endOfWeek(crosstabWeek, { weekStartsOn: 1 }) : endDate;

        const data = await getWeekdayCrosstab(rangeStart, rangeEnd, selectedGrade, includeFuture);
        if (!cancelled) setWeekdayCrosstab(data);
      } catch (err) {
        if (!cancelled) console.error('Failed to load weekday crosstab:', err);
      } finally {
        if (!cancelled) setIsCrosstabLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, selectedGrade, includeFuture, activeTab, crosstabWeek]);

  // 주간 열람실 통계 (null이면 전체 기간 roomStats를 그대로 사용)
  useEffect(() => {
    if (roomStatsWeek === null || activeTab !== 'overview') {
      setWeeklyRoomStats(null);
      return;
    }
    let cancelled = false;

    const load = async () => {
      setIsRoomStatsWeekLoading(true);
      try {
        const weekStart = startOfWeek(roomStatsWeek, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(roomStatsWeek, { weekStartsOn: 1 });

        const data = await getRoomStatistics(weekStart, weekEnd, selectedGrade, includeFuture);
        if (!cancelled) setWeeklyRoomStats(data);
      } catch (err) {
        if (!cancelled) console.error('Failed to load weekly room stats:', err);
      } finally {
        if (!cancelled) setIsRoomStatsWeekLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [roomStatsWeek, selectedGrade, includeFuture, activeTab]);

  // 학생 통계 (students 탭 + weekday 탭 명단 카드에서 사용)
  useEffect(() => {
    if (activeTab !== 'students' && activeTab !== 'weekday') return;
    let cancelled = false;

    const loadStudentStats = async () => {
      try {
        setIsStudentsLoading(true);
        setError(null);

        const { statistics, dailyAttendance } = await getStudentStatsBundle(
          startDate,
          endDate,
          selectedGrade,
          includeFuture,
          selectedRoom
        );

        if (cancelled) return;
        setStudentStats(statistics);
        setDailyAttendanceStats(dailyAttendance);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '학생 통계를 불러오는데 실패했습니다.');
        }
      } finally {
        if (!cancelled) setIsStudentsLoading(false);
      }
    };

    loadStudentStats();

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, selectedGrade, includeFuture, activeTab, selectedRoom]);

  // ==========================================================================
  // 파생 값 (렌더마다 재계산되지 않도록 메모)
  // ==========================================================================

  const effectiveOverallStats = selectedRoom ? roomScopedStats : overallStats;
  const isOverviewRefreshing = isOverviewLoading || isRoomScopedLoading;
  const hasStudentData = studentStats.length > 0 || dailyAttendanceStats.length > 0;

  const dayColumns = useMemo(
    () =>
      validateDateRange(startDate, endDate)
        ? []
        : eachDayOfInterval({ start: startDate, end: endDate }),
    [startDate, endDate]
  );

  const weekOptions = useMemo(
    () => buildWeekOptions(startDate, endDate, includeFuture),
    [startDate, endDate, includeFuture]
  );

  const roomOptions = useMemo(
    () => roomStats.map(stat => ({ roomId: stat.roomId, roomName: stat.roomName })),
    [roomStats]
  );

  const visibleRoomStats = useMemo(
    () =>
      (weeklyRoomStats || roomStats).filter(stat => !selectedRoom || stat.roomId === selectedRoom),
    [weeklyRoomStats, roomStats, selectedRoom]
  );

  const trendData = useMemo(
    () => (trendMode === 'monthly' ? monthlyStats : weeklyStats),
    [trendMode, monthlyStats, weeklyStats]
  );

  const trendChartColumns = useMemo(
    () => [
      { key: trendMode === 'monthly' ? 'month' : 'weekLabel', label: '기간' },
      { key: 'totalReservations', label: '총 신청' },
      { key: 'attended', label: '출석' },
      { key: 'attendanceRate', label: '출석률', format: (value: any) => `${value}%` },
    ],
    [trendMode]
  );

  // 출석률 파이 차트 데이터
  const attendancePieData = useMemo(
    () =>
      effectiveOverallStats
        ? [
            { name: '출석', value: effectiveOverallStats.totalAttended },
            { name: '결석', value: effectiveOverallStats.totalAbsent },
          ]
        : [],
    [effectiveOverallStats]
  );

  // ==========================================================================
  // 내보내기 / 불러오기
  // ==========================================================================

  const exportFileName = (extension: string) =>
    `일별출석현황_${format(startDate, 'yyyy-MM-dd')}_${format(endDate, 'yyyy-MM-dd')}.${extension}`;

  const exportDailyAttendanceToCSV = useCallback(() => {
    const daysWithData = getDaysWithData(dailyAttendanceStats, startDate, endDate);
    if (daysWithData.length === 0) {
      showWarning('내보낼 데이터가 없습니다.');
      return;
    }

    const matrix = buildAttendanceMatrix(dailyAttendanceStats, daysWithData);
    downloadCSV(rowsToCSV(matrix), exportFileName('csv'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyAttendanceStats, startDate, endDate, showWarning]);

  const exportDailyAttendanceToExcel = useCallback(() => {
    const daysWithData = getDaysWithData(dailyAttendanceStats, startDate, endDate);
    if (daysWithData.length === 0) {
      showWarning('내보낼 데이터가 없습니다.');
      return;
    }

    downloadExcel(
      buildAttendanceSheets(dailyAttendanceStats, daysWithData),
      exportFileName('xlsx')
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyAttendanceStats, startDate, endDate, showWarning]);

  /** 크게보기 팝업 — 현재 필터를 빠짐없이 넘겨 부모 화면과 같은 숫자를 보여줍니다. */
  const openDetailWindow = useCallback(
    (path: string) => {
      const url = `${path}?${serializeStatisticsFilters(filters)}`;
      window.open(url, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    },
    [filters]
  );

  // CSV 파일 불러오기
  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const content = await file.text();
      const year = startDate.getFullYear();
      const { items, errors: parseErrors } = parseAttendanceCSV(content, year);

      if (parseErrors.length > 0) {
        setImportResult({
          success: 0,
          failed: 0,
          notFound: [],
          errors: parseErrors,
        });
        return;
      }

      if (items.length === 0) {
        setImportResult({
          success: 0,
          failed: 0,
          notFound: [],
          errors: ['파싱된 데이터가 없습니다.'],
        });
        return;
      }

      const result = await bulkUpdateAttendance(items);
      setImportResult(result);

      // 성공 시 데이터 새로고침 (캐시는 bulkUpdateAttendance가 무효화합니다)
      if (result.success > 0) {
        const { statistics, dailyAttendance } = await getStudentStatsBundle(
          startDate,
          endDate,
          selectedGrade,
          includeFuture,
          selectedRoom
        );
        setStudentStats(statistics);
        setDailyAttendanceStats(dailyAttendance);
      }
    } catch (err) {
      setImportResult({
        success: 0,
        failed: 0,
        notFound: [],
        errors: [err instanceof Error ? err.message : 'CSV 파일 처리 중 오류가 발생했습니다.'],
      });
    } finally {
      setIsImporting(false);
      // 파일 입력 초기화
      event.target.value = '';
    }
  };

  if (!user || (user.type !== 'teacher' && user.type !== 'admin')) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">교사만 접근할 수 있습니다.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="통계 대시보드">
      <h1 className="sr-only">통계 대시보드</h1>

      <div className="space-y-5 sm:space-y-6">
        {/* 에러 메시지 */}
        {error && (
          <div
            role="alert"
            className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3"
          >
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
        )}

        {/* 필터 (대시보드는 draft 모드: 적용 버튼을 눌러야 반영) */}
        <StatisticsFilterBar
          value={draftFilters}
          onChange={setDraftFilters}
          rooms={roomOptions}
          onApply={applyFilters}
        />

        {/* 탭 네비게이션 */}
        <div
          role="tablist"
          aria-label="통계 보기"
          className="content-surface grid grid-cols-3 gap-1 rounded-2xl p-1.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold outline-none transition-[background-color,color,box-shadow,transform] focus-visible:ring-2 focus-visible:ring-ring/30 active:scale-[0.98] ${
              activeTab === 'overview'
                ? 'bg-card text-foreground shadow-card'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sm:hidden">요약</span>
            <span className="hidden sm:inline">통계 대시보드</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'students'}
            onClick={() => setActiveTab('students')}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold outline-none transition-[background-color,color,box-shadow,transform] focus-visible:ring-2 focus-visible:ring-ring/30 active:scale-[0.98] ${
              activeTab === 'students'
                ? 'bg-card text-foreground shadow-card'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sm:hidden">학생별</span>
            <span className="hidden sm:inline">학생별 상세 분석</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'weekday'}
            onClick={() => setActiveTab('weekday')}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold outline-none transition-[background-color,color,box-shadow,transform] focus-visible:ring-2 focus-visible:ring-ring/30 active:scale-[0.98] ${
              activeTab === 'weekday'
                ? 'bg-card text-foreground shadow-card'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            }`}
          >
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sm:hidden">요일별</span>
            <span className="hidden sm:inline">요일별 현황</span>
          </button>
        </div>

        {activeTab === 'overview' ? (
          isOverviewRefreshing && !effectiveOverallStats ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : effectiveOverallStats ? (
            <div className={refreshingClass(isOverviewRefreshing)} aria-busy={isOverviewRefreshing}>
              {isOverviewRefreshing && <RefreshingHint />}
              {/* 전체 통계 카드 */}
              <div className="mb-5 grid grid-cols-2 gap-3 sm:mb-6 lg:grid-cols-3 xl:grid-cols-6">
                <StatCard
                  label="총 신청"
                  value={effectiveOverallStats.totalReservations.toLocaleString()}
                  icon={<ClipboardList className="h-4 w-4" />}
                />
                <StatCard
                  label="출석"
                  tone="success"
                  value={effectiveOverallStats.totalAttended.toLocaleString()}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                />
                <StatCard
                  label="결석"
                  tone="danger"
                  value={effectiveOverallStats.totalAbsent.toLocaleString()}
                  hint="지난 예약 기준"
                  icon={<XCircle className="h-4 w-4" />}
                />
                <StatCard
                  label="출석률"
                  tone="info"
                  value={`${effectiveOverallStats.overallAttendanceRate}%`}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <StatCard
                  label="이용 학생"
                  tone="primary"
                  value={effectiveOverallStats.uniqueStudents || '-'}
                  icon={<Users className="h-4 w-4" />}
                />
                <StatCard
                  label="활성 열람실"
                  tone="warning"
                  value={effectiveOverallStats.activeRooms}
                  icon={<DoorOpen className="h-4 w-4" />}
                />
              </div>

              {/* 차트 그리드 */}
              <div className="mb-5 grid grid-cols-1 gap-5 sm:mb-6 lg:grid-cols-2">
                {/* 학년별 이용 통계 */}
                <section className="content-surface rounded-[2rem] p-5 sm:p-7">
                  <div className="mb-5">
                    <h2 className="text-xl font-bold tracking-[-0.025em] text-foreground">
                      학년별 이용 통계
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      학년별 신청 수와 실제 출석을 비교합니다.
                    </p>
                  </div>
                  <AccessibleChart
                    title="학년별 이용 통계"
                    data={gradeStats}
                    columns={GRADE_CHART_COLUMNS}
                  >
                    <ResponsiveContainer width="100%" height={300} minWidth={1}>
                      <BarChart data={gradeStats} barSize={32}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke={chartTheme.grid}
                        />
                        <XAxis
                          dataKey="grade"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: chartTheme.axisTick, fontSize: 12 }}
                          tickFormatter={value => `${value}학년`}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: chartTheme.axisTick, fontSize: 12 }}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-card p-3 border border-border/70 rounded-lg shadow-lg">
                                  <p className="font-bold text-foreground mb-2">{label}학년</p>
                                  <div className="space-y-1 text-sm">
                                    <p className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                      <span className="text-muted-foreground">총 신청:</span>
                                      <span className="font-medium text-foreground">
                                        {data.totalReservations}
                                      </span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                      <span className="text-muted-foreground">출석 완료:</span>
                                      <span className="font-medium text-foreground">
                                        {data.attended}
                                      </span>
                                    </p>
                                    <p className="border-t border-border/70 my-1 pt-1 mt-2">
                                      <span className="text-muted-foreground">출석률: </span>
                                      <span
                                        className={`font-bold ${getAttendanceRateTextColor(data.attendanceRate)}`}
                                      >
                                        {data.attendanceRate}%
                                      </span>
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend
                          verticalAlign="top"
                          align="right"
                          iconType="circle"
                          wrapperStyle={{ paddingBottom: '20px' }}
                        />
                        <Bar
                          animationDuration={CHART_ANIMATION_MS}
                          dataKey="totalReservations"
                          fill="#3b82f6"
                          name="총 신청"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          animationDuration={CHART_ANIMATION_MS}
                          dataKey="attended"
                          fill="#10b981"
                          name="출석"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </AccessibleChart>
                </section>

                {/* 출석률 파이 차트 */}
                <section className="content-surface h-full rounded-[2rem] p-5 sm:p-7">
                  <div className="mb-5">
                    <h2 className="text-xl font-bold tracking-[-0.025em] text-foreground">
                      전체 출석률
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      지난 예약 중 출석과 결석의 비율입니다.
                    </p>
                  </div>
                  <AccessibleChart
                    title="전체 출석률"
                    data={attendancePieData}
                    columns={PIE_CHART_COLUMNS}
                  >
                    <div className="relative h-[300px]">
                      <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                        <PieChart>
                          <Pie
                            animationDuration={CHART_ANIMATION_MS}
                            data={attendancePieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {attendancePieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.name === '출석' ? '#10b981' : '#ef4444'}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0];
                                return (
                                  <div className="bg-card p-3 border border-border/70 rounded-lg shadow-lg">
                                    <p className="flex items-center gap-2">
                                      <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: data.payload.fill }}
                                      ></span>
                                      <span className="text-muted-foreground font-medium">
                                        {data.name}:
                                      </span>
                                      <span className="font-bold text-foreground">
                                        {data.value}
                                      </span>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 pl-5">
                                      {effectiveOverallStats &&
                                      effectiveOverallStats.totalReservations > 0
                                        ? `${Math.round((Number(data.value) / effectiveOverallStats.totalReservations) * 100)}%`
                                        : '0%'}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={value => (
                              <span className="text-muted-foreground ml-1">{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      {/* 중앙 텍스트 */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <p className="text-4xl font-bold text-foreground">
                          {effectiveOverallStats?.overallAttendanceRate}%
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">출석률</p>
                      </div>
                    </div>
                  </AccessibleChart>
                </section>
              </div>

              {/* 추이 차트 */}
              <section className="content-surface mb-5 rounded-[2rem] p-5 sm:mb-6 sm:p-7">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-[-0.025em] text-foreground">
                      신청 및 출석 추이
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      기간별 출석률의 흐름을 확인합니다.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* 월별/주별 전환 토글 */}
                    <div className="flex rounded-xl bg-muted p-1">
                      <button
                        type="button"
                        aria-pressed={trendMode === 'monthly'}
                        onClick={() => setTrendMode('monthly')}
                        className={`min-h-9 rounded-lg px-3 text-sm font-semibold transition-[background-color,color,box-shadow] ${
                          trendMode === 'monthly'
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        월별
                      </button>
                      <button
                        type="button"
                        aria-pressed={trendMode === 'weekly'}
                        onClick={() => setTrendMode('weekly')}
                        className={`min-h-9 rounded-lg px-3 text-sm font-semibold transition-[background-color,color,box-shadow] ${
                          trendMode === 'weekly'
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        주별
                      </button>
                    </div>
                    {/* 필터 컨트롤 */}
                    <div className="flex flex-wrap gap-3 rounded-xl border border-border/60 bg-muted/25 px-3 py-2">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          checked={selectedSeries.includes('overall')}
                          onChange={e => {
                            if (e.target.checked) setSelectedSeries(prev => [...prev, 'overall']);
                            else setSelectedSeries(prev => prev.filter(s => s !== 'overall'));
                          }}
                        />
                        <span className="ml-2 text-sm text-foreground">전체</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-purple-600 shadow-sm focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                          checked={selectedSeries.includes('grade1')}
                          onChange={e => {
                            if (e.target.checked) setSelectedSeries(prev => [...prev, 'grade1']);
                            else setSelectedSeries(prev => prev.filter(s => s !== 'grade1'));
                          }}
                        />
                        <span className="ml-2 text-sm text-foreground">1학년</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                          checked={selectedSeries.includes('grade2')}
                          onChange={e => {
                            if (e.target.checked) setSelectedSeries(prev => [...prev, 'grade2']);
                            else setSelectedSeries(prev => prev.filter(s => s !== 'grade2'));
                          }}
                        />
                        <span className="ml-2 text-sm text-foreground">2학년</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-pink-600 shadow-sm focus:border-pink-300 focus:ring focus:ring-pink-200 focus:ring-opacity-50"
                          checked={selectedSeries.includes('grade3')}
                          onChange={e => {
                            if (e.target.checked) setSelectedSeries(prev => [...prev, 'grade3']);
                            else setSelectedSeries(prev => prev.filter(s => s !== 'grade3'));
                          }}
                        />
                        <span className="ml-2 text-sm text-foreground">3학년</span>
                      </label>
                    </div>
                  </div>
                </div>

                <AccessibleChart
                  title={`${trendMode === 'monthly' ? '월별' : '주별'} 신청 및 출석 추이`}
                  data={trendData}
                  columns={trendChartColumns}
                >
                  <ResponsiveContainer width="100%" height={300} minWidth={1}>
                    <LineChart data={trendMode === 'monthly' ? monthlyStats : weeklyStats}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={chartTheme.grid}
                      />
                      <XAxis
                        dataKey={trendMode === 'monthly' ? 'month' : 'week'}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: chartTheme.axisTick, fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: chartTheme.axisTick, fontSize: 12 }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload as MonthlyStatistics | WeeklyStatistics;
                            const displayLabel =
                              trendMode === 'weekly' && 'weekLabel' in data
                                ? data.weekLabel
                                : label;
                            return (
                              <div className="bg-card p-3 border border-border/70 rounded-lg shadow-lg">
                                <p className="font-bold text-foreground mb-2">{displayLabel}</p>
                                <div className="space-y-3 text-sm">
                                  {/* 전체 통계 */}
                                  {selectedSeries.includes('overall') && (
                                    <div className="space-y-1">
                                      <p className="font-semibold text-foreground border-b border-gray-100 pb-1 mb-1">
                                        전체
                                      </p>
                                      <p className="flex items-center justify-between gap-4">
                                        <span className="text-muted-foreground">총 신청:</span>
                                        <span className="font-medium text-blue-600 dark:text-blue-400">
                                          {data.totalReservations}
                                        </span>
                                      </p>
                                      <p className="flex items-center justify-between gap-4">
                                        <span className="text-muted-foreground">출석:</span>
                                        <span className="font-medium text-green-600 dark:text-green-400">
                                          {data.attended}
                                        </span>
                                      </p>
                                      <p className="flex items-center justify-between gap-4">
                                        <span className="text-muted-foreground">출석률:</span>
                                        <span className="font-bold text-foreground">
                                          {data.attendanceRate}%
                                        </span>
                                      </p>
                                    </div>
                                  )}

                                  {/* 학년별 통계 */}
                                  {[1, 2, 3].map(grade => {
                                    if (!selectedSeries.includes(`grade${grade}`)) return null;
                                    const gradeData = data.byGrade[grade];
                                    if (!gradeData) return null;

                                    return (
                                      <div
                                        key={grade}
                                        className="space-y-1 pt-2 border-t border-border/70"
                                      >
                                        <p className="font-semibold text-foreground border-b border-gray-100 pb-1 mb-1">
                                          {grade}학년
                                        </p>
                                        <p className="flex items-center justify-between gap-4">
                                          <span className="text-muted-foreground">총 신청:</span>
                                          <span className="font-medium text-foreground">
                                            {gradeData.totalReservations}
                                          </span>
                                        </p>
                                        <p className="flex items-center justify-between gap-4">
                                          <span className="text-muted-foreground">출석:</span>
                                          <span className="font-medium text-foreground">
                                            {gradeData.attended}
                                          </span>
                                        </p>
                                        <p className="flex items-center justify-between gap-4">
                                          <span className="text-muted-foreground">출석률:</span>
                                          <span className="font-bold text-foreground">
                                            {gradeData.attendanceRate}%
                                          </span>
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '20px' }}
                      />

                      {/* 전체 */}
                      {selectedSeries.includes('overall') && (
                        <Line
                          animationDuration={CHART_ANIMATION_MS}
                          type="monotone"
                          dataKey="attendanceRate"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          name="전체 출석률"
                          unit="%"
                        />
                      )}

                      {/* 1학년 */}
                      {selectedSeries.includes('grade1') && (
                        <Line
                          animationDuration={CHART_ANIMATION_MS}
                          type="monotone"
                          dataKey="byGrade.1.attendanceRate"
                          stroke="#9333ea"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="1학년 출석률"
                          unit="%"
                        />
                      )}

                      {/* 2학년 */}
                      {selectedSeries.includes('grade2') && (
                        <Line
                          animationDuration={CHART_ANIMATION_MS}
                          type="monotone"
                          dataKey="byGrade.2.attendanceRate"
                          stroke="#4f46e5"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="2학년 출석률"
                          unit="%"
                        />
                      )}

                      {/* 3학년 */}
                      {selectedSeries.includes('grade3') && (
                        <Line
                          animationDuration={CHART_ANIMATION_MS}
                          type="monotone"
                          dataKey="byGrade.3.attendanceRate"
                          stroke="#db2777"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="3학년 출석률"
                          unit="%"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </AccessibleChart>
              </section>

              {/* 열람실별 상세 통계 */}
              {visibleRoomStats.length > 0 && (
                <section className="content-surface overflow-hidden rounded-[2rem]">
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                    <div>
                      <h2 className="text-xl font-bold tracking-[-0.025em] text-foreground">
                        열람실별 상세 통계
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        공간별 신청 수와 출석률을 비교합니다.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {showRoomStatsSpinner && <LoadingSpinner size="sm" />}
                      <select
                        value={roomStatsWeek === null ? '' : roomStatsWeek.toISOString()}
                        onChange={e => {
                          if (e.target.value === '') {
                            setRoomStatsWeek(null);
                          } else {
                            setRoomStatsWeek(new Date(e.target.value));
                          }
                        }}
                        disabled={isRoomStatsWeekLoading}
                        className="min-h-10 rounded-xl border border-border/80 bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-ring/25"
                      >
                        <option value="">전체 기간</option>
                        {weekOptions.map(week => (
                          <option key={week.value} value={week.value}>
                            {week.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetailWindow('/teacher/statistics/rooms')}
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                          />
                        </svg>
                        크게보기
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            열람실
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            학년
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            총 신청
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            출석
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            출석률
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {visibleRoomStats.map(stat => (
                          <tr key={stat.roomId} className="hover:bg-muted/60">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                              {stat.roomName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              {stat.grade}학년
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                              {stat.totalReservations}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                              {stat.attended}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Badge tone={attendanceRateTone(stat.attendanceRate)}>
                                {stat.attendanceRate}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<BarChart3 className="h-6 w-6" />}
              title="표시할 통계가 없습니다"
              description="선택한 기간에 신청 내역이 없습니다. 기간이나 학년 필터를 조정해 보세요."
            />
          )
        ) : activeTab === 'students' ? ( // Students Tab Content
          isStudentsLoading && !hasStudentData ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className={refreshingClass(isStudentsLoading)} aria-busy={isStudentsLoading}>
              {isStudentsLoading && <RefreshingHint />}
              {/* 일별 출석 현황 테이블 */}
              <section className="content-surface mb-5 overflow-hidden rounded-[2rem] sm:mb-6">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                  <div>
                    <h2 className="text-xl font-bold tracking-[-0.025em] text-foreground">
                      일별 출석 현황
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      날짜별 출석 상태를 학생 단위로 확인합니다.
                    </p>
                  </div>
                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                    {/* CSV 불러오기 버튼 (admin만 표시) */}
                    {user?.type === 'admin' && (
                      <label
                        className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-input bg-card px-3 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:bg-muted/60 ${isImporting ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleImportCSV}
                          disabled={isImporting}
                          className="hidden"
                        />
                        {isImporting ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                        )}
                        CSV 불러오기
                      </label>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={exportDailyAttendanceToCSV}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      CSV 내보내기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={exportDailyAttendanceToExcel}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Excel 내보내기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => openDetailWindow('/teacher/statistics/daily')}
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                        />
                      </svg>
                      크게보기
                    </Button>
                  </div>
                </div>
                <DailyAttendanceMatrix students={dailyAttendanceStats} dates={dayColumns} />
              </section>

              {/* 학생별 통계 테이블 */}
              <section className="content-surface overflow-hidden rounded-[2rem]">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                  <div>
                    <h2 className="text-xl font-bold tracking-[-0.025em] text-foreground">
                      학생별 이용 통계
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      학생별 신청·출석·요일 이용 패턴을 살펴봅니다.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => openDetailWindow('/teacher/statistics/students')}
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                    크게보기
                  </Button>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full relative">
                    <thead className="bg-muted sticky top-0 z-10">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          학번
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          이름
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          총 신청
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          출석
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          결석
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          월
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          화
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          수
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          목
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          금
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {studentStats.map(stat => (
                        <tr key={stat.studentId} className="hover:bg-muted/60">
                          <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {stat.studentNumber || stat.email.split('@')[0]}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                            {stat.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                            {stat.totalReservations}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                            {stat.attended}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                            {stat.absent}
                          </td>
                          {[1, 2, 3, 4, 5].map(day => (
                            <td
                              key={day}
                              className="px-3 py-4 whitespace-nowrap text-sm text-center text-foreground"
                            >
                              {formatRoomSessions(stat.weekdayRooms[day])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )
        ) : (
          // Weekday Tab Content (요일별 현황)
          <WeekdayTabContent
            studentStats={studentStats}
            weekdayCrosstab={weekdayCrosstab}
            selectedRoom={selectedRoom}
            isStudentsLoading={isStudentsLoading}
            crosstabWeek={crosstabWeek}
            isCrosstabLoading={isCrosstabLoading}
            showCrosstabSpinner={showCrosstabSpinner}
            weekOptions={weekOptions}
            onCrosstabWeekChange={setCrosstabWeek}
          />
        )}
      </div>

      {/* CSV 불러오기 결과 모달 */}
      {importResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">CSV 불러오기 결과</h3>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {/* 요약 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">성공</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {importResult.success}건
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">실패</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {importResult.failed}건
                  </p>
                </div>
              </div>

              {/* 오류 메시지 */}
              {importResult.errors.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-foreground mb-2">오류 메시지</h4>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg max-h-32 overflow-y-auto">
                    {importResult.errors.map((err, idx) => (
                      <p key={idx} className="text-sm text-red-600 dark:text-red-400">
                        {err}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* DB에 없는 데이터 */}
              {importResult.notFound.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">
                    DB에 없는 데이터 ({importResult.notFound.length}건)
                  </h4>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg max-h-48 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-yellow-700 dark:text-yellow-400">
                          <th className="pb-2">학번</th>
                          <th className="pb-2">이름</th>
                          <th className="pb-2">날짜</th>
                          <th className="pb-2">교시</th>
                        </tr>
                      </thead>
                      <tbody className="text-yellow-600 dark:text-yellow-300">
                        {importResult.notFound.slice(0, 20).map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-1">{item.studentNumber}</td>
                            <td className="py-1">{item.name}</td>
                            <td className="py-1">{item.date}</td>
                            <td className="py-1">{item.period}교시</td>
                          </tr>
                        ))}
                        {importResult.notFound.length > 20 && (
                          <tr>
                            <td colSpan={4} className="py-1 text-center">
                              ... 외 {importResult.notFound.length - 20}건
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-border">
              <Button variant="primary" className="w-full" onClick={() => setImportResult(null)}>
                확인
              </Button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
};
