import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { Layout } from '@components/common/Layout';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { StatisticsFilterBar } from '@components/statistics/StatisticsFilterBar';
import { DailyAttendanceMatrix } from '@components/statistics/DailyAttendanceMatrix';
import {
  getStudentDailyAttendance,
  parseAttendanceCSV,
  bulkUpdateAttendance,
  type StudentDailyAttendance,
  type AttendanceUpdateResult,
} from '@services/statistics.service';
import { Modal } from '@components/common/Modal';
import { EmptyState } from '@components/common/EmptyState';
import { CalendarDays } from 'lucide-react';
import { eachDayOfInterval } from 'date-fns';
import {
  parseStatisticsFilters,
  validateDateRange,
  type StatisticsFilters,
} from '@utils/statisticsFilters';

export const DailyAttendancePage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // 부모 화면(통계 대시보드)이 넘긴 필터를 그대로 복원합니다.
  const [filters, setFilters] = useState<StatisticsFilters>(() =>
    parseStatisticsFilters(searchParams)
  );
  const { startDate, endDate, grade, roomId, includeFuture } = filters;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyAttendanceStats, setDailyAttendanceStats] = useState<StudentDailyAttendance[]>([]);

  // CSV 불러오기 상태
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<AttendanceUpdateResult | null>(null);

  const rangeError = useMemo(() => validateDateRange(startDate, endDate), [startDate, endDate]);

  /** 표의 날짜 컬럼 — 렌더마다 다시 만들지 않도록 메모합니다. */
  const dayColumns = useMemo(
    () => (rangeError ? [] : eachDayOfInterval({ start: startDate, end: endDate })),
    [startDate, endDate, rangeError]
  );

  const fetchAttendance = useCallback(
    () => getStudentDailyAttendance(startDate, endDate, grade, includeFuture, roomId),
    [startDate, endDate, grade, includeFuture, roomId]
  );

  // CSV 파일 불러오기
  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const content = await file.text();
      const year = startDate.getFullYear();
      const { items, errors: parseErrors } = parseAttendanceCSV(content, year);

      if (parseErrors.length > 0 && items.length === 0) {
        setImportResult({ success: 0, failed: 0, notFound: [], errors: parseErrors });
        return;
      }

      const result = await bulkUpdateAttendance(items);
      if (parseErrors.length > 0) {
        result.errors = [...parseErrors, ...result.errors];
      }
      setImportResult(result);

      // 데이터 새로고침 (캐시는 bulkUpdateAttendance가 무효화합니다)
      setDailyAttendanceStats(await fetchAttendance());
    } catch (err) {
      setImportResult({
        success: 0,
        failed: 0,
        notFound: [],
        errors: [err instanceof Error ? err.message : 'CSV 파일 처리 중 오류가 발생했습니다.'],
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  // 데이터 로드 (취소 가드로 늦게 도착한 이전 응답이 최신 결과를 덮어쓰지 않게 합니다)
  useEffect(() => {
    if (rangeError) return;
    let cancelled = false;

    const loadStatistics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchAttendance();
        if (!cancelled) setDailyAttendanceStats(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadStatistics();

    return () => {
      cancelled = true;
    };
  }, [fetchAttendance, rangeError]);

  if (!user || (user.type !== 'teacher' && user.type !== 'admin')) {
    return (
      <Layout showNavigation={false} showFooter={false}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">교사만 접근할 수 있습니다.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showNavigation={false} showFooter={false} title="일별 출석 현황 (상세)">
      <StatisticsFilterBar value={filters} onChange={setFilters} variant="card" />

      {/* CSV 불러오기 (admin만) */}
      {user?.type === 'admin' && (
        <div className="mb-6">
          <label
            className={`cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-input text-foreground bg-card hover:bg-muted/60 ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* 테이블 */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : dailyAttendanceStats.length > 0 ? (
        <div className="content-surface overflow-hidden rounded-[2rem]">
          <DailyAttendanceMatrix
            students={dailyAttendanceStats}
            dates={dayColumns}
            showAbsentCount
            className="h-[calc(100vh-250px)] min-h-[28rem]"
            scrollAreaClassName="min-h-0 flex-1"
          />
        </div>
      ) : (
        <div className="bg-card border border-border/70 rounded-xl shadow-card">
          <EmptyState
            icon={<CalendarDays className="h-6 w-6" />}
            title="표시할 출석 기록이 없습니다"
            description="선택한 기간에 신청 내역이 없습니다."
          />
        </div>
      )}
      {/* CSV 불러오기 결과 모달 */}
      <Modal
        isOpen={!!importResult}
        onClose={() => setImportResult(null)}
        title="CSV 불러오기 결과"
        size="md"
      >
        {importResult && (
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex-1">
                <p className="text-2xl font-bold text-green-600">{importResult.success}</p>
                <p className="text-xs text-gray-500">성공</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg flex-1">
                <p className="text-2xl font-bold text-muted-foreground">{importResult.failed}</p>
                <p className="text-xs text-gray-500">실패</p>
              </div>
              <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex-1">
                <p className="text-2xl font-bold text-red-600">{importResult.errors.length}</p>
                <p className="text-xs text-gray-500">오류</p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 rounded-lg p-3 space-y-1">
                {importResult.errors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
};
