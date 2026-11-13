import { format, startOfWeek } from 'date-fns';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import type { StudentStatistics, WeekdayCrosstab } from '@services/statistics.service';
import type { WeekOption } from '@utils/statisticsFilters';

const WEEKDAYS: { idx: number; label: string }[] = [
  { idx: 1, label: '월' },
  { idx: 2, label: '화' },
  { idx: 3, label: '수' },
  { idx: 4, label: '목' },
  { idx: 5, label: '금' },
];

interface WeekdayTabContentProps {
  studentStats: StudentStatistics[];
  weekdayCrosstab: WeekdayCrosstab[];
  selectedRoom: string | null;
  isStudentsLoading: boolean;
  crosstabWeek: Date | null;
  isCrosstabLoading: boolean;
  showCrosstabSpinner: boolean;
  /** 상위에서 메모해 전달하는 주 목록 (대시보드의 열람실 통계와 동일한 계산) */
  weekOptions: WeekOption[];
  onCrosstabWeekChange: (week: Date | null) => void;
}

/**
 * 요일별 현황 탭
 * - 요일별 명단 카드: 각 요일(월~금)에 신청한 학생 명단을 한 눈에 표시
 * - 요일별 신청 현황 교차표: 열람실 × 요일 신청 수 (기존 통계 대시보드에서 이동)
 */
export const WeekdayTabContent = ({
  studentStats,
  weekdayCrosstab,
  selectedRoom,
  isStudentsLoading,
  crosstabWeek,
  isCrosstabLoading,
  showCrosstabSpinner,
  weekOptions,
  onCrosstabWeekChange,
}: WeekdayTabContentProps) => {
  // 선택된 열람실 이름 (명단 카드의 열람실 필터링에 사용)
  const selectedRoomName = selectedRoom
    ? weekdayCrosstab.find(row => row.roomId === selectedRoom)?.roomName
    : null;

  // 요일별 신청 학생 명단 파생 (studentStats.weekdayRooms 기반)
  const rosterByDay = WEEKDAYS.map(({ idx }) => {
    const students = studentStats.filter(stat => {
      const rooms = stat.weekdayRooms[idx];
      if (!rooms || rooms.length === 0) return false;
      // 열람실 필터: 선택된 열람실 이름이 해당 요일 신청 목록에 포함되어야 함
      if (selectedRoomName) return rooms.includes(selectedRoomName);
      return true;
    });
    return { dayIdx: idx, students };
  });

  const crosstabRows = weekdayCrosstab.filter(row => !selectedRoom || row.roomId === selectedRoom);

  return (
    <>
      {/* 요일별 명단 카드 */}
      <section className="content-surface mb-5 rounded-[2rem] p-5 sm:mb-6 sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-[-0.025em] text-foreground">
              요일별 신청자 명단
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              반복 이용 학생을 요일별로 한눈에 확인합니다.
            </p>
          </div>
          {isStudentsLoading && <LoadingSpinner size="sm" />}
        </div>
        {studentStats.length === 0 && !isStudentsLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">신청 데이터가 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {rosterByDay.map(({ dayIdx, students }) => {
              const label = WEEKDAYS.find(w => w.idx === dayIdx)!.label;
              return (
                <div
                  key={dayIdx}
                  className="flex flex-col overflow-hidden rounded-[1.25rem] border border-border/70 bg-card"
                >
                  <div className="flex items-center justify-between bg-muted/60 px-3 py-2.5">
                    <span className="text-sm font-bold text-foreground">{label}요일</span>
                    <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                      {students.length}명
                    </span>
                  </div>
                  <div className="flex-1 max-h-[360px] overflow-y-auto divide-y divide-border/60">
                    {students.length > 0 ? (
                      students.map(stat => (
                        <div key={stat.studentId} className="flex items-baseline gap-2 px-3 py-1.5">
                          <span className="text-sm font-medium text-foreground truncate">
                            {stat.name}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {stat.studentNumber || stat.email.split('@')[0]}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="px-3 py-4 text-xs text-muted-foreground/70 text-center">-</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 요일별 신청 현황 교차표 */}
      {(weekdayCrosstab.length > 0 || crosstabWeek !== null) && (
        <section className="content-surface overflow-hidden rounded-[2rem]">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <h2 className="text-xl font-bold tracking-[-0.025em] text-foreground">
                요일별 신청 현황
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                열람실별 요일 수요와 고유 인원을 비교합니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {showCrosstabSpinner && <LoadingSpinner size="sm" />}
              <select
                value={crosstabWeek === null ? '' : crosstabWeek.toISOString()}
                onChange={e => {
                  onCrosstabWeekChange(e.target.value === '' ? null : new Date(e.target.value));
                }}
                disabled={isCrosstabLoading}
                className="min-h-10 w-full rounded-xl border border-border/80 bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-ring/25 sm:w-auto"
              >
                <option value="">전체 기간</option>
                {weekOptions.map(week => (
                  <option key={week.value} value={week.value}>
                    {week.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    열람실
                  </th>
                  {WEEKDAYS.map(({ idx, label }, i) => {
                    const weekStart = crosstabWeek
                      ? startOfWeek(crosstabWeek, { weekStartsOn: 1 })
                      : null;
                    const dateLabel = weekStart
                      ? format(new Date(weekStart.getTime() + i * 86400000), 'M/d')
                      : null;
                    return (
                      <th
                        key={idx}
                        className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      >
                        {label}
                        {dateLabel && (
                          <span className="block text-[10px] font-normal text-gray-400">
                            {dateLabel}
                          </span>
                        )}
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-center text-xs font-bold text-foreground uppercase tracking-wider bg-muted">
                    합계
                  </th>
                  <th
                    className="px-4 py-3 text-center text-xs font-bold text-foreground uppercase tracking-wider bg-muted"
                    title="월~금 중복 제외 고유 학생 수"
                  >
                    인원수
                    <span className="block text-[10px] font-normal text-gray-500 dark:text-gray-300 normal-case">
                      (중복 제외)
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {crosstabRows.map(row => (
                  <tr key={row.roomId} className="hover:bg-muted/60">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {row.roomName}
                    </td>
                    {WEEKDAYS.map(({ idx }) => (
                      <td
                        key={idx}
                        className="px-4 py-4 whitespace-nowrap text-sm text-center text-foreground"
                      >
                        {row.byDay[idx] || 0}
                      </td>
                    ))}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-foreground bg-muted/50">
                      {row.total}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-primary-700 dark:text-primary-300 bg-muted/50">
                      {row.uniqueStudents}
                    </td>
                  </tr>
                ))}
                {/* 합계 행 */}
                <tr className="bg-muted font-bold">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">합계</td>
                  {WEEKDAYS.map(({ idx }) => {
                    const dayTotal = crosstabRows.reduce(
                      (sum, row) => sum + (row.byDay[idx] || 0),
                      0
                    );
                    return (
                      <td
                        key={idx}
                        className="px-4 py-4 whitespace-nowrap text-sm text-center text-foreground"
                      >
                        {dayTotal}
                      </td>
                    );
                  })}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-foreground bg-gray-200 dark:bg-gray-500">
                    {crosstabRows.reduce((sum, row) => sum + row.total, 0)}
                  </td>
                  <td
                    className="px-4 py-4 whitespace-nowrap text-sm text-center text-primary-700 dark:text-primary-200 bg-gray-200 dark:bg-gray-500"
                    title="각 열람실 인원수의 단순 합 (열람실 간 중복 가능)"
                  >
                    {crosstabRows.reduce((sum, row) => sum + row.uniqueStudents, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
};
