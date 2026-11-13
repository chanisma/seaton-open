import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { Layout } from '@components/common/Layout';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { EmptyState } from '@components/common/EmptyState';
import { Users } from 'lucide-react';
import { StatisticsFilterBar } from '@components/statistics/StatisticsFilterBar';
import { getStudentStatistics, type StudentStatistics } from '@services/statistics.service';
import { getTemperatureColor } from '@utils/temperature';
import { formatRoomSessions } from '@utils/roomSession';
import {
  parseStatisticsFilters,
  validateDateRange,
  type StatisticsFilters,
} from '@utils/statisticsFilters';

const WEEKDAYS = [
  { idx: 1, label: '월' },
  { idx: 2, label: '화' },
  { idx: 3, label: '수' },
  { idx: 4, label: '목' },
  { idx: 5, label: '금' },
];

const TH_CLASS =
  'px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border';

export const StudentStatisticsPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // 부모 화면(통계 대시보드)이 넘긴 필터를 그대로 복원합니다.
  const [filters, setFilters] = useState<StatisticsFilters>(() =>
    parseStatisticsFilters(searchParams)
  );
  const { startDate, endDate, grade, roomId, includeFuture } = filters;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentStats, setStudentStats] = useState<StudentStatistics[]>([]);

  const rangeError = useMemo(() => validateDateRange(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    if (rangeError) return;
    let cancelled = false;

    const loadStatistics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getStudentStatistics(startDate, endDate, grade, includeFuture, roomId);
        if (!cancelled) setStudentStats(data);
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
  }, [startDate, endDate, grade, includeFuture, roomId, rangeError]);

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
    <Layout showNavigation={false} showFooter={false} title="학생별 이용 통계 (상세)">
      <StatisticsFilterBar value={filters} onChange={setFilters} variant="card" />

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : studentStats.length > 0 ? (
        <div className="bg-card border border-border/70 rounded-xl shadow-card overflow-hidden flex flex-col h-[calc(100vh-250px)]">
          <div className="overflow-auto flex-1">
            <table className="w-full relative border-collapse">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th scope="col" className={`${TH_CLASS} sticky left-0 bg-muted z-20`}>
                    이메일
                  </th>
                  <th
                    scope="col"
                    className={`${TH_CLASS} sticky left-[200px] bg-muted z-20 border-r border-border shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]`}
                  >
                    이름
                  </th>
                  <th scope="col" className={TH_CLASS}>
                    총 신청
                  </th>
                  <th scope="col" className={TH_CLASS}>
                    출석
                  </th>
                  <th scope="col" className={TH_CLASS}>
                    결석
                  </th>
                  {WEEKDAYS.map(({ idx, label }) => (
                    <th key={idx} scope="col" className={`${TH_CLASS} text-center`}>
                      {label}
                    </th>
                  ))}
                  <th scope="col" className={TH_CLASS}>
                    기간 내 온도 변화
                  </th>
                  <th scope="col" className={TH_CLASS}>
                    현재 온도
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {studentStats.map(stat => (
                  <tr key={stat.studentId} className="hover:bg-muted/60">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground sticky left-0 bg-card z-10 border-r border-border">
                      {stat.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground sticky left-[200px] bg-card z-10 border-r border-border shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
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
                    {WEEKDAYS.map(({ idx }) => (
                      <td
                        key={idx}
                        className="px-6 py-4 whitespace-nowrap text-sm text-center text-foreground"
                      >
                        {formatRoomSessions(stat.weekdayRooms[idx])}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={
                          stat.temperatureChange > 0
                            ? 'text-green-600'
                            : stat.temperatureChange < 0
                              ? 'text-red-600'
                              : 'text-gray-500'
                        }
                      >
                        {stat.temperatureChange > 0 ? '+' : ''}
                        {stat.temperatureChange}°C
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      <span className={getTemperatureColor(stat.currentTemperature)}>
                        {stat.currentTemperature}°C
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border/70 rounded-xl shadow-card">
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="표시할 학생이 없습니다"
            description="선택한 기간에 신청 내역이 없습니다."
          />
        </div>
      )}
    </Layout>
  );
};
