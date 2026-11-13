import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { Layout } from '@components/common/Layout';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { EmptyState } from '@components/common/EmptyState';
import { Badge, attendanceRateTone } from '@components/common/Badge';
import { StatisticsFilterBar } from '@components/statistics/StatisticsFilterBar';
import { DoorOpen } from 'lucide-react';
import { getRoomStatistics, type RoomStatistics } from '@services/statistics.service';
import {
  parseStatisticsFilters,
  validateDateRange,
  type StatisticsFilters,
} from '@utils/statisticsFilters';

const TH_CLASS =
  'px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border';
const TD_CLASS = 'px-6 py-4 whitespace-nowrap text-sm border-b border-border/70';

export const RoomStatisticsPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState<StatisticsFilters>(() =>
    parseStatisticsFilters(searchParams)
  );
  const { startDate, endDate, grade, roomId, includeFuture } = filters;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomStats, setRoomStats] = useState<RoomStatistics[]>([]);

  const rangeError = useMemo(() => validateDateRange(startDate, endDate), [startDate, endDate]);

  useEffect(() => {
    if (rangeError) return;
    let cancelled = false;

    const loadStatistics = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getRoomStatistics(startDate, endDate, grade, includeFuture);
        if (!cancelled) setRoomStats(data);
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
  }, [startDate, endDate, grade, includeFuture, rangeError]);

  // 열람실 필터는 RPC 인자가 없어 조회 후 걸러냅니다.
  const visibleStats = useMemo(
    () => roomStats.filter(stat => !roomId || stat.roomId === roomId),
    [roomStats, roomId]
  );

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
    <Layout showNavigation={false} showFooter={false} title="열람실별 상세 통계 (상세)">
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
      ) : visibleStats.length > 0 ? (
        <div className="bg-card border border-border/70 rounded-xl shadow-card overflow-hidden flex flex-col h-[calc(100vh-250px)]">
          <div className="overflow-auto flex-1">
            <table className="w-full relative border-collapse">
              <thead className="bg-muted sticky top-0 z-10">
                <tr>
                  <th scope="col" className={TH_CLASS}>
                    열람실
                  </th>
                  <th scope="col" className={TH_CLASS}>
                    학년
                  </th>
                  <th scope="col" className={TH_CLASS}>
                    총 신청
                  </th>
                  <th scope="col" className={TH_CLASS}>
                    출석
                  </th>
                  <th scope="col" className={TH_CLASS}>
                    출석률
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleStats.map(stat => (
                  <tr key={stat.roomId} className="hover:bg-muted/60">
                    <td className={`${TD_CLASS} font-medium text-foreground`}>{stat.roomName}</td>
                    <td className={`${TD_CLASS} text-foreground`}>{stat.grade}학년</td>
                    <td className={`${TD_CLASS} text-foreground`}>{stat.totalReservations}</td>
                    <td className={`${TD_CLASS} text-green-600 dark:text-green-400`}>
                      {stat.attended}
                    </td>
                    <td className={TD_CLASS}>
                      <Badge tone={attendanceRateTone(stat.attendanceRate)}>
                        {stat.attendanceRate}%
                      </Badge>
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
            icon={<DoorOpen className="h-6 w-6" />}
            title="표시할 열람실이 없습니다"
            description="선택한 기간에 신청 내역이 없습니다."
          />
        </div>
      )}
    </Layout>
  );
};
