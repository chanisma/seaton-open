import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Modal } from '@components/common/Modal';
import { Button } from '@components/common/Button';
import { useStudyRooms } from '@/contexts/StudyRoomContext';
import {
  getReservationCountsByDateRange,
  getReservationStatsByDates,
  deleteReservationsByDates,
  type DateReservationStats,
} from '@services/reservation.service';

interface DateBulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 삭제 성공 시 실제 삭제된 건수, 대상 날짜 목록, 대상 학년(빈 배열 = 전체)을 전달 */
  onSuccess: (deletedCount: number, dates: string[], grades: number[]) => void;
}

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const GRADE_OPTIONS = [1, 2, 3];

/**
 * 삭제 안전 정책 (Deletion guard)
 * ------------------------------------------------------------------
 * 선택한 날짜들의 예약을 통째로 지우는 것은 복구 불가능한 파괴적 작업이다.
 * 미리보기 통계(stats)를 받아서 "삭제를 막을지 / 확인 문구 입력을 요구할지 /
 * 어떤 경고를 보여줄지"를 결정한다.
 *
 * 아래는 기본 정책이다. 운영 정책에 맞게 자유롭게 조정하라:
 *  - 출석 처리된 기록이 있으면 아예 삭제를 막고 싶다면 blocked=true 로
 *  - 항상 확인 문구 입력을 요구하고 싶다면 requireTypedConfirm 를 무조건 true 로
 *  - 대량 삭제(예: 200건 초과)일 때만 확인을 받고 싶다면 total 기준 추가
 */
const evaluateDeletionGuard = (
  stats: DateReservationStats
): { blocked: boolean; requireTypedConfirm: boolean; warning: string | null } => {
  if (stats.total === 0) {
    return { blocked: true, requireTypedConfirm: false, warning: null };
  }
  // 이미 출석 처리된 예약은 출석 기록까지 함께 사라지므로 더 강한 확인을 요구한다.
  if (stats.attended > 0) {
    return {
      blocked: false,
      requireTypedConfirm: true,
      warning: `이 중 ${stats.attended}건은 이미 출석 처리된 예약입니다. 삭제하면 출석 기록도 함께 삭제됩니다.`,
    };
  }
  return { blocked: false, requireTypedConfirm: false, warning: null };
};

export const DateBulkDeleteModal = ({ isOpen, onClose, onSuccess }: DateBulkDeleteModalProps) => {
  const { studyRooms } = useStudyRooms();

  // 선택된 날짜들 (yyyy-MM-dd). 달력에서 클릭으로 토글 — 범위가 아닌 개별 선택
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  // 선택된 열람실 id 목록. 비어 있으면 전체 열람실
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  // 선택된 학년 목록. 비어 있으면 전체 학년 (여러 학년 공용 열람실에서 한 학년만 지울 때 사용)
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [monthCounts, setMonthCounts] = useState<Record<string, number>>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [stats, setStats] = useState<DateReservationStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typedConfirm, setTypedConfirm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (!isOpen) return;
    setSelectedDates([]);
    setSelectedRoomIds([]);
    setSelectedGrades([]);
    setCalendarMonth(startOfMonth(new Date()));
    setMonthCounts({});
    setStats(null);
    setTypedConfirm('');
    setErrorMsg('');
    setIsDeleting(false);
  }, [isOpen]);

  // 달력에 표시할 날짜 격자 (해당 월 + 앞뒤 빈칸을 주 단위로 채움)
  const calendarDays = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(calendarMonth));
    const gridEnd = endOfWeek(endOfMonth(calendarMonth));
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [calendarMonth]);

  // 달력에 "어느 날에 예약이 몇 건 있는지" 표시하기 위한 건수 조회
  const loadMonthCounts = useCallback(async () => {
    if (!isOpen || calendarDays.length === 0) return;
    const start = format(calendarDays[0], 'yyyy-MM-dd');
    const end = format(calendarDays[calendarDays.length - 1], 'yyyy-MM-dd');
    try {
      setIsLoadingCounts(true);
      const counts = await getReservationCountsByDateRange(
        start,
        end,
        selectedRoomIds.length > 0 ? selectedRoomIds : undefined,
        selectedGrades.length > 0 ? selectedGrades : undefined
      );
      setMonthCounts(counts);
    } catch {
      setMonthCounts({});
    } finally {
      setIsLoadingCounts(false);
    }
  }, [isOpen, calendarDays, selectedRoomIds, selectedGrades]);

  useEffect(() => {
    loadMonthCounts();
  }, [loadMonthCounts]);

  // 날짜/열람실/학년이 바뀌면 미리보기 통계 조회
  const loadStats = useCallback(async () => {
    if (selectedDates.length === 0) {
      setStats(null);
      return;
    }
    try {
      setIsLoadingStats(true);
      setErrorMsg('');
      const data = await getReservationStatsByDates({
        dates: selectedDates,
        roomIds: selectedRoomIds.length > 0 ? selectedRoomIds : undefined,
        grades: selectedGrades.length > 0 ? selectedGrades : undefined,
      });
      setStats(data);
    } catch (err) {
      setStats(null);
      setErrorMsg(err instanceof Error ? err.message : '예약 통계 조회에 실패했습니다.');
    } finally {
      setIsLoadingStats(false);
    }
  }, [selectedDates, selectedRoomIds, selectedGrades]);

  useEffect(() => {
    loadStats();
    setTypedConfirm(''); // 조건이 바뀌면 확인 입력도 리셋
  }, [loadStats]);

  const toggleDate = (dateStr: string) => {
    setSelectedDates(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr].sort()
    );
  };

  const toggleRoom = (roomId: string) => {
    setSelectedRoomIds(prev =>
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  const toggleGrade = (grade: number) => {
    setSelectedGrades(prev =>
      prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade].sort()
    );
  };

  const guard = stats ? evaluateDeletionGuard(stats) : null;
  // 날짜 1개면 기존처럼 날짜를 그대로 입력, 여러 날짜면 '삭제'를 입력받는다
  const confirmPhrase = selectedDates.length === 1 ? selectedDates[0] : '삭제';
  const typedConfirmOk = !guard?.requireTypedConfirm || typedConfirm.trim() === confirmPhrase;
  const canDelete =
    !!stats && !!guard && !guard.blocked && typedConfirmOk && !isDeleting && !isLoadingStats;

  const handleDelete = async () => {
    if (selectedDates.length === 0 || !canDelete) return;
    setIsDeleting(true);
    setErrorMsg('');
    try {
      const deleted = await deleteReservationsByDates({
        dates: selectedDates,
        roomIds: selectedRoomIds.length > 0 ? selectedRoomIds : undefined,
        grades: selectedGrades.length > 0 ? selectedGrades : undefined,
      });
      onSuccess(deleted, selectedDates, selectedGrades);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '예약 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const targetRoomLabel =
    selectedRoomIds.length === 0
      ? '전체 열람실'
      : selectedRoomIds.length === 1
        ? (studyRooms.find(r => r.id === selectedRoomIds[0])?.name ?? '선택한 열람실')
        : `열람실 ${selectedRoomIds.length}곳`;
  const targetGradeLabel =
    selectedGrades.length === 0 ? '전체 학년' : selectedGrades.map(g => `${g}학년`).join('·');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="날짜별 예약 일괄 삭제"
      size="lg"
      closeOnOverlayClick={false}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            닫기
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={!canDelete}
            isLoading={isDeleting}
          >
            {stats && stats.total > 0 ? `${stats.total}건 삭제` : '삭제'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          공휴일·시험일처럼 예약을 받지 않는 날의 예약을 한 번에 정리합니다. 달력에서 날짜를 눌러
          여러 날짜를 선택할 수 있습니다.{' '}
          <span className="font-medium text-red-600 dark:text-red-400">
            삭제된 예약은 복구할 수 없습니다.
          </span>
        </p>

        {errorMsg && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-red-700 dark:text-red-300">
            {errorMsg}
          </div>
        )}

        {/* 날짜 선택 달력 (다중 선택) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-foreground">
              삭제할 날짜{' '}
              <span className="text-xs text-gray-400">(여러 날짜를 선택할 수 있습니다)</span>
            </label>
            {isLoadingCounts && <span className="text-xs text-gray-400">건수 집계 중…</span>}
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            {/* 월 네비게이션 */}
            <div className="flex items-center justify-between px-3 py-2 bg-background">
              <button
                type="button"
                onClick={() => setCalendarMonth(m => addMonths(m, -1))}
                className="p-1.5 rounded-md hover:bg-muted/60 text-foreground"
                aria-label="이전 달"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-foreground">
                {format(calendarMonth, 'yyyy년 M월', { locale: ko })}
              </span>
              <button
                type="button"
                onClick={() => setCalendarMonth(m => addMonths(m, 1))}
                className="p-1.5 rounded-md hover:bg-muted/60 text-foreground"
                aria-label="다음 달"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 border-t border-border">
              {WEEKDAY_LABELS.map((label, idx) => (
                <div
                  key={label}
                  className={`py-1.5 text-center text-xs font-medium ${
                    idx === 0
                      ? 'text-red-500'
                      : idx === 6
                        ? 'text-blue-500'
                        : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* 날짜 격자 */}
            <div className="grid grid-cols-7 gap-px bg-border border-t border-border">
              {calendarDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const inMonth = isSameMonth(day, calendarMonth);
                const isSelected = selectedDates.includes(dateStr);
                const count = monthCounts[dateStr] ?? 0;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => toggleDate(dateStr)}
                    className={`relative min-h-[52px] px-1 py-1.5 flex flex-col items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-red-500 text-white'
                        : inMonth
                          ? 'bg-card hover:bg-muted/60 text-foreground'
                          : 'bg-background text-gray-400 hover:bg-muted/40'
                    }`}
                  >
                    <span
                      className={`text-sm leading-none ${
                        isToday(day) && !isSelected ? 'font-bold text-primary-600' : ''
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    {count > 0 && (
                      <span
                        className={`mt-1 text-[10px] leading-none ${
                          isSelected ? 'text-white/90' : 'text-muted-foreground'
                        }`}
                      >
                        {count}건
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 선택된 날짜 칩 목록 */}
          {selectedDates.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {selectedDates.map(dateStr => (
                <span
                  key={dateStr}
                  className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300"
                >
                  {dateStr}
                  <button
                    type="button"
                    onClick={() => toggleDate(dateStr)}
                    className="p-0.5 rounded-full hover:bg-red-200/60 dark:hover:bg-red-800/60"
                    aria-label={`${dateStr} 선택 해제`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setSelectedDates([])}
                className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
              >
                전체 해제
              </button>
            </div>
          )}
        </div>

        {/* 열람실 다중 선택 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-foreground">
              열람실 <span className="text-xs text-gray-400">(미선택 시 전체 열람실)</span>
            </label>
            {selectedRoomIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedRoomIds([])}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                전체 해제
              </button>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border">
            {studyRooms.length === 0 && (
              <div className="px-3 py-3 text-sm text-gray-400 text-center">
                등록된 열람실이 없습니다.
              </div>
            )}
            {studyRooms.map(room => (
              <label
                key={room.id}
                className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/60"
              >
                <input
                  type="checkbox"
                  checked={selectedRoomIds.includes(room.id)}
                  onChange={() => toggleRoom(room.id)}
                  className="w-4 h-4 rounded border-input accent-red-500"
                />
                <span className="text-foreground">{room.name}</span>
                {room.grades?.length > 0 && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {room.grades.map(g => `${g}학년`).join('·')}
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* 학년 다중 선택 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-foreground">
              학년{' '}
              <span className="text-xs text-gray-400">
                (미선택 시 전체 학년 · 여러 학년 공용 열람실에서 일부 학년만 삭제할 때 선택)
              </span>
            </label>
            {selectedGrades.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedGrades([])}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                전체 해제
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {GRADE_OPTIONS.map(grade => {
              const isSelected = selectedGrades.includes(grade);
              return (
                <button
                  key={grade}
                  type="button"
                  onClick={() => toggleGrade(grade)}
                  aria-pressed={isSelected}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'bg-card border-border text-foreground hover:bg-muted/60'
                  }`}
                >
                  {grade}학년
                </button>
              );
            })}
          </div>
          {selectedGrades.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              학년을 확인할 수 없는 예약(교사 계정 등)은 삭제 대상에서 제외됩니다.
            </p>
          )}
        </div>

        {/* 미리보기 */}
        {selectedDates.length > 0 && (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="px-3 py-2 bg-background flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">
                날짜 {selectedDates.length}일 · {targetRoomLabel} · {targetGradeLabel} 삭제 대상
              </span>
              {isLoadingStats ? (
                <span className="text-xs text-gray-400">집계 중…</span>
              ) : (
                <span
                  className={`text-xs font-bold ${
                    stats && stats.total > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'
                  }`}
                >
                  {stats?.total ?? 0}건
                </span>
              )}
            </div>

            {!isLoadingStats && stats && stats.total > 0 && (
              <div className="max-h-56 overflow-y-auto">
                <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-muted-foreground">
                  날짜별
                </div>
                <ul className="divide-y divide-border">
                  {stats.byDate.map(d => (
                    <li
                      key={d.date}
                      className="px-3 py-2 text-sm flex items-center justify-between"
                    >
                      <span className="text-foreground">{d.date}</span>
                      <span className="text-muted-foreground text-xs">
                        {d.count}건
                        {d.attended > 0 && (
                          <span className="ml-1 text-amber-600 dark:text-amber-400">
                            (출석 {d.attended})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-muted-foreground border-t border-border">
                  열람실별
                </div>
                <ul className="divide-y divide-border">
                  {stats.byRoom.map(room => (
                    <li
                      key={room.roomId}
                      className="px-3 py-2 text-sm flex items-center justify-between"
                    >
                      <span className="text-foreground">{room.roomName}</span>
                      <span className="text-muted-foreground text-xs">
                        {room.count}건
                        {room.attended > 0 && (
                          <span className="ml-1 text-amber-600 dark:text-amber-400">
                            (출석 {room.attended})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="px-3 pt-2 pb-1 text-[11px] font-medium text-muted-foreground border-t border-border">
                  학년별
                </div>
                <ul className="divide-y divide-border">
                  {stats.byGrade.map(g => (
                    <li
                      key={g.grade ?? 'unknown'}
                      className="px-3 py-2 text-sm flex items-center justify-between"
                    >
                      <span className="text-foreground">
                        {g.grade ? `${g.grade}학년` : '학년 미확인'}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {g.count}건
                        {g.attended > 0 && (
                          <span className="ml-1 text-amber-600 dark:text-amber-400">
                            (출석 {g.attended})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!isLoadingStats && stats && stats.total === 0 && (
              <div className="px-3 py-4 text-center text-sm text-gray-400">
                선택한 날짜에 삭제할 예약이 없습니다.
              </div>
            )}
          </div>
        )}

        {/* 출석 기록 경고 */}
        {guard?.warning && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300">
            <span className="font-semibold">⚠ 주의:</span> {guard.warning}
          </div>
        )}

        {/* 확인 문구 입력 (강한 확인이 필요한 경우) */}
        {guard?.requireTypedConfirm && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              확인을 위해 <span className="font-mono">{confirmPhrase}</span> 를 그대로 입력하세요
            </label>
            <input
              type="text"
              value={typedConfirm}
              onChange={e => setTypedConfirm(e.target.value)}
              placeholder={confirmPhrase}
              className="w-full px-3 py-2 border border-input rounded-md text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
