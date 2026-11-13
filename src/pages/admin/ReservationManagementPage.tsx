import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@components/common/Button';
import { useToast } from '@hooks/useToast';
import { ToastContainer } from '@components/common/Toast';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import {
  getStudentList,
  getStudentReservations,
  getStudentTemperature,
  deleteReservations,
} from '@services/reservation.service';
import type { SeatReservation } from '@/types/reservation.types';
import {
  parseISO,
  isBefore,
  startOfDay,
  isSameDay,
  format,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft } from 'lucide-react';

import { useAuth } from '@hooks/useAuth';
import { Layout } from '@components/common/Layout';
import { AdminReservationModal } from '@components/admin/AdminReservationModal';
import { DateBulkDeleteModal } from '@components/admin/DateBulkDeleteModal';
import { Modal, ConfirmModal } from '@components/common/Modal';
import { useStudyRooms } from '@/contexts/StudyRoomContext';

interface StudentListItem {
  id: string;
  email: string;
  name: string;
  grade: number | null;
  class: number | null;
  student_number: string | null;
}

type ReservationSortKey = 'date' | 'room' | 'seat' | 'period' | 'attendance';
type SortDirection = 'asc' | 'desc';

const SORT_COLUMNS: { key: ReservationSortKey; label: string }[] = [
  { key: 'date', label: '날짜' },
  { key: 'room', label: '열람실' },
  { key: 'seat', label: '좌석' },
  { key: 'period', label: '교시' },
  { key: 'attendance', label: '출석' },
];

// 모바일(iOS)은 16px 미만 입력창에 포커스하면 화면을 확대하므로 모바일에서만 16px
const INPUT_CLASS =
  'w-full px-3 py-2 border border-input rounded-md text-base sm:text-sm dark:bg-gray-700 dark:text-white';

const getPeriodLabel = (reservation: SeatReservation) =>
  reservation.period_id != null && reservation.period_id > 0
    ? (reservation.study_rooms?.operating_periods as any[])?.find(
        (p: any) => p.id === reservation.period_id
      )?.name || `${reservation.period_id}교시`
    : '종일';

const AttendanceBadge = ({ reservation }: { reservation: SeatReservation }) => {
  const [label, tone] =
    reservation.attendance_status === 'excused'
      ? ['인정출석', 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200']
      : reservation.is_attended
        ? ['출석', 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200']
        : ['미출석', 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'];
  return (
    <span
      className={`px-2 inline-flex shrink-0 text-xs leading-5 font-semibold rounded-full ${tone}`}
    >
      {label}
    </span>
  );
};

const EditIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

// 출석 정렬 순서: 출석 → 인정출석 → 미출석
const attendanceRank = (r: SeatReservation) =>
  r.attendance_status === 'excused' ? 1 : r.is_attended ? 0 : 2;

export const ReservationManagementPage = () => {
  const { user } = useAuth();
  const { toasts, removeToast, success, error: showError } = useToast();
  const { studyRooms } = useStudyRooms();

  // Student list state
  const [gradeFilter, setGradeFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [studentList, setStudentList] = useState<StudentListItem[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Selected student state
  const [selectedStudent, setSelectedStudent] = useState<StudentListItem | null>(null);

  // Reservation state
  const [studentReservations, setStudentReservations] = useState<SeatReservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [dateFilterStart, setDateFilterStart] = useState<string>('');
  const [dateFilterEnd, setDateFilterEnd] = useState<string>('');
  const [sortKey, setSortKey] = useState<ReservationSortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Temperature state
  const [temperature, setTemperature] = useState<number | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'change'>('add');
  const [editingReservation, setEditingReservation] = useState<SeatReservation | undefined>(
    undefined
  );

  // Single delete confirm modal state
  const [deleteOneId, setDeleteOneId] = useState<string | null>(null);

  // 날짜별 일괄 삭제 모달 상태 (학생과 무관한 전역 작업)
  const [showDateDeleteModal, setShowDateDeleteModal] = useState(false);

  // Pagination state
  const PAGE_SIZE = 15;
  const [reservationPage, setReservationPage] = useState(1);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelStartDate, setCancelStartDate] = useState('');
  const [cancelEndDate, setCancelEndDate] = useState('');
  const [cancelRoomId, setCancelRoomId] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Load student list
  const loadStudents = useCallback(async () => {
    try {
      setIsLoadingStudents(true);
      const data = await getStudentList(gradeFilter);
      setStudentList(data as StudentListItem[]);
    } catch (err) {
      showError(err instanceof Error ? err.message : '학생 목록 조회 실패');
    } finally {
      setIsLoadingStudents(false);
    }
  }, [gradeFilter]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Load selected student's reservations
  const loadStudentReservations = useCallback(async () => {
    if (!selectedStudent) return;
    try {
      setIsLoadingReservations(true);
      const start = dateFilterStart ? new Date(dateFilterStart) : null;
      const end = dateFilterEnd ? new Date(dateFilterEnd) : null;
      const data = await getStudentReservations(selectedStudent.id, start, end);
      setStudentReservations(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : '예약 목록 조회 실패');
    } finally {
      setIsLoadingReservations(false);
    }
  }, [selectedStudent, dateFilterStart, dateFilterEnd]);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentReservations();
      getStudentTemperature(selectedStudent.id).then(setTemperature);
    } else {
      setStudentReservations([]);
      setTemperature(null);
    }
  }, [selectedStudent, loadStudentReservations]);

  // Compute stats from loaded reservations
  const studentStats = useMemo(() => {
    if (studentReservations.length === 0) return null;

    const today = startOfDay(new Date());
    const isPastClosingTime = new Date().getHours() >= 23;

    let total = 0;
    let attended = 0;
    let absent = 0;

    studentReservations.forEach(r => {
      total++;
      if (r.is_attended) {
        attended++;
      } else {
        const resDate = startOfDay(parseISO(r.reservation_date));
        const isPast = isBefore(resDate, today);
        const isToday = isSameDay(resDate, today);
        if (isPast || (isToday && isPastClosingTime)) {
          absent++;
        }
      }
    });

    const decidedTotal = attended + absent;
    const attendanceRate = decidedTotal > 0 ? Math.round((attended / decidedTotal) * 100) : 0;

    return { total, attended, absent, attendanceRate };
  }, [studentReservations]);

  // 정렬: 선택한 컬럼 기준(오름/내림차순), 동률이면 날짜 → 열람실 → 교시 오름차순
  const sortedReservations = useMemo(() => {
    const byDate = (a: SeatReservation, b: SeatReservation) =>
      a.reservation_date.localeCompare(b.reservation_date);
    const byRoom = (a: SeatReservation, b: SeatReservation) =>
      (a.study_rooms?.name || '').localeCompare(b.study_rooms?.name || '', 'ko');
    const byPeriod = (a: SeatReservation, b: SeatReservation) =>
      (a.period_id || 0) - (b.period_id || 0);

    const primary: Record<ReservationSortKey, (a: SeatReservation, b: SeatReservation) => number> =
      {
        date: byDate,
        room: byRoom,
        seat: (a, b) =>
          (a.seat_number || '').localeCompare(b.seat_number || '', 'ko', { numeric: true }),
        period: byPeriod,
        attendance: (a, b) => attendanceRank(a) - attendanceRank(b),
      };
    const sign = sortDirection === 'asc' ? 1 : -1;

    return [...studentReservations].sort(
      (a, b) => sign * primary[sortKey](a, b) || byDate(a, b) || byRoom(a, b) || byPeriod(a, b)
    );
  }, [studentReservations, sortKey, sortDirection]);

  // 같은 컬럼을 다시 누르면 방향 전환, 다른 컬럼이면 오름차순부터
  const handleSort = (key: ReservationSortKey) => {
    if (key === sortKey) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setReservationPage(1);
  };

  // 시작일~종료일이 정확히 한 달 전체일 때만 월 선택값으로 표시
  const selectedMonth = useMemo(() => {
    if (!dateFilterStart || !dateFilterEnd) return '';
    const start = parseISO(dateFilterStart);
    const isFullMonth =
      dateFilterStart === format(startOfMonth(start), 'yyyy-MM-dd') &&
      dateFilterEnd === format(endOfMonth(start), 'yyyy-MM-dd');
    return isFullMonth ? format(start, 'yyyy-MM') : '';
  }, [dateFilterStart, dateFilterEnd]);

  // 월 선택 시 시작일/종료일을 해당 월의 첫날/말일로 세팅 (빈 값이면 기간 초기화)
  const handleMonthChange = (month: string) => {
    if (!month) {
      setDateFilterStart('');
      setDateFilterEnd('');
    } else {
      const first = parseISO(`${month}-01`);
      setDateFilterStart(format(first, 'yyyy-MM-dd'));
      setDateFilterEnd(format(endOfMonth(first), 'yyyy-MM-dd'));
    }
    setReservationPage(1);
  };

  const totalReservationPages = Math.ceil(sortedReservations.length / PAGE_SIZE);
  const pagedReservations = useMemo(
    () => sortedReservations.slice((reservationPage - 1) * PAGE_SIZE, reservationPage * PAGE_SIZE),
    [sortedReservations, reservationPage]
  );

  // Client-side filtering for search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentList;
    const q = searchQuery.trim().toLowerCase();
    return studentList.filter(
      s =>
        s.name?.toLowerCase().includes(q) ||
        s.student_number?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q)
    );
  }, [studentList, searchQuery]);

  const handleSelectStudent = (student: StudentListItem) => {
    setSelectedStudent(student);
    setDateFilterStart('');
    setDateFilterEnd('');
    setTemperature(null);
    setReservationPage(1);
    // 모바일은 목록 대신 상세 화면으로 전환되므로 맨 위부터 보여준다
    if (window.matchMedia('(max-width: 1023px)').matches) window.scrollTo({ top: 0 });
  };

  const handleDeleteOne = async () => {
    if (!deleteOneId) return;
    try {
      await deleteReservations([deleteOneId]);
      success('예약이 삭제되었습니다.');
      loadStudentReservations();
    } catch (err) {
      showError('예약 삭제에 실패했습니다.');
    } finally {
      setDeleteOneId(null);
    }
  };

  const handleAddReservation = () => {
    if (!selectedStudent) return;
    setModalMode('add');
    setEditingReservation(undefined);
    setIsModalOpen(true);
  };

  const handleEditSeat = (reservation: SeatReservation) => {
    setModalMode('change');
    setEditingReservation(reservation);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    success(modalMode === 'add' ? '예약이 추가되었습니다.' : '좌석이 변경되었습니다.');
    loadStudentReservations();
  };

  // 좌석 변경 (최신 예약 기준)
  const handleChangeSeat = () => {
    if (!selectedStudent || studentReservations.length === 0) return;
    setModalMode('change');
    setEditingReservation(studentReservations[0]);
    setIsModalOpen(true);
  };

  // 기간 취소 모달 열기
  const handleOpenCancelModal = () => {
    setCancelStartDate('');
    setCancelEndDate('');
    setCancelRoomId('');
    setShowCancelModal(true);
  };

  // 기간 내 취소 대상 예약 목록
  const cancelTargetReservations = useMemo(() => {
    if (!cancelStartDate || !cancelEndDate) return [];
    return studentReservations.filter(r => {
      const inDateRange =
        r.reservation_date >= cancelStartDate && r.reservation_date <= cancelEndDate;
      const matchesRoom = !cancelRoomId || r.room_id === cancelRoomId;
      return inDateRange && matchesRoom;
    });
  }, [studentReservations, cancelStartDate, cancelEndDate, cancelRoomId]);

  // 기간 예약 일괄 취소
  const handleBulkCancel = async () => {
    if (cancelTargetReservations.length === 0) return;
    setIsCancelling(true);
    try {
      const ids = cancelTargetReservations.map(r => r.id);
      await deleteReservations(ids);
      success(`${cancelTargetReservations.length}건의 예약이 취소되었습니다.`);
      setShowCancelModal(false);
      loadStudentReservations();
    } catch (err) {
      showError('예약 취소에 실패했습니다.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Layout title="예약 관리">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 h-full">
        {/* Left Panel: Student List — 모바일에서는 학생을 고르면 상세 화면으로 전환 */}
        <div
          className={`${selectedStudent ? 'hidden lg:flex' : 'flex'} lg:w-1/3 flex-col bg-card rounded-xl shadow`}
        >
          {/* Student List Header */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">학생 목록</h2>
              {user?.type === 'admin' && (
                <button
                  onClick={() => setShowDateDeleteModal(true)}
                  className="inline-flex min-h-10 items-center gap-1 -mr-1 px-1 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  title="공휴일·시험일 등 특정 날짜의 예약을 일괄 삭제"
                >
                  <DeleteIcon />
                  날짜별 일괄 삭제
                </button>
              )}
            </div>

            <div className="grid grid-cols-[8.5rem_1fr] gap-2 lg:grid-cols-1 lg:gap-3">
              {/* Grade Filter */}
              <select
                value={gradeFilter ?? ''}
                onChange={e => {
                  setGradeFilter(e.target.value ? Number(e.target.value) : null);
                  setSelectedStudent(null);
                }}
                aria-label="학년"
                className={INPUT_CLASS}
              >
                <option value="">전체 학년</option>
                <option value="1">1학년</option>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
              </select>

              {/* Search */}
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="이름 또는 학번 검색..."
                aria-label="학생 검색"
                className={INPUT_CLASS}
              />
            </div>

            <p className="text-xs text-muted-foreground">{filteredStudents.length}명</p>
          </div>

          {/* Student List Body — 모바일은 페이지 스크롤, 데스크톱은 패널 내부 스크롤 */}
          <div className="flex-1 lg:overflow-y-auto lg:max-h-[calc(100vh-320px)]">
            {isLoadingStudents ? (
              <div className="p-8 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">학생이 없습니다.</div>
            ) : (
              <ul className="divide-y divide-border">
                {filteredStudents.map(student => (
                  <li key={student.id}>
                    <button
                      onClick={() => handleSelectStudent(student)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/60 transition-colors ${
                        selectedStudent?.id === student.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-foreground">{student.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {student.grade && student.class
                            ? `${student.grade}-${student.class}`
                            : ''}
                        </span>
                      </div>
                      {student.student_number && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {student.student_number}
                        </p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Panel: Reservation Detail */}
        <div
          className={`${selectedStudent ? 'flex' : 'hidden lg:flex'} lg:w-2/3 flex-col bg-card rounded-xl shadow`}
        >
          {!selectedStudent ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <p className="mt-2 text-sm">왼쪽에서 학생을 선택하세요</p>
              </div>
            </div>
          ) : (
            <>
              {/* Student Info Card */}
              <div className="p-4 border-b border-border">
                {/* 모바일 전용: 학생 목록으로 돌아가기 */}
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="lg:hidden -ml-2 mb-2 inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  학생 목록
                </button>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start justify-between gap-3 sm:block">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-foreground">
                        {selectedStudent.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedStudent.grade && selectedStudent.class
                          ? `${selectedStudent.grade}학년 ${selectedStudent.class}반`
                          : '학년/반 정보 없음'}
                        {selectedStudent.student_number && ` | ${selectedStudent.student_number}`}
                      </p>
                    </div>
                    <span className="sm:hidden shrink-0 text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                      {studentReservations.length}건
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
                    <span className="hidden sm:inline text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                      {studentReservations.length}건
                    </span>
                    {(user?.type === 'teacher' || user?.type === 'admin') && (
                      <>
                        <Button size="sm" variant="primary" onClick={handleAddReservation}>
                          예약 추가
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleChangeSeat}
                          disabled={studentReservations.length === 0}
                        >
                          좌석 변경
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                          onClick={handleOpenCancelModal}
                          disabled={studentReservations.length === 0}
                        >
                          기간 취소
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats Cards — 모바일도 한 줄 5칸 */}
                {studentStats && (
                  <div className="mt-3 grid grid-cols-5 gap-1.5 sm:gap-2">
                    {[
                      {
                        label: '총 예약',
                        value: studentStats.total,
                        box: 'bg-muted/50',
                        labelTone: 'text-muted-foreground',
                        valueTone: 'text-foreground',
                      },
                      {
                        label: '출석',
                        value: studentStats.attended,
                        box: 'bg-green-50 dark:bg-green-900/20',
                        labelTone: 'text-green-600 dark:text-green-400',
                        valueTone: 'text-green-700 dark:text-green-300',
                      },
                      {
                        label: '결석',
                        value: studentStats.absent,
                        box: 'bg-red-50 dark:bg-red-900/20',
                        labelTone: 'text-red-600 dark:text-red-400',
                        valueTone: 'text-red-700 dark:text-red-300',
                      },
                      {
                        label: '출석률',
                        value: `${studentStats.attendanceRate}%`,
                        box: 'bg-blue-50 dark:bg-blue-900/20',
                        labelTone: 'text-blue-600 dark:text-blue-400',
                        valueTone: 'text-blue-700 dark:text-blue-300',
                      },
                      {
                        label: '온도',
                        value: temperature !== null ? `${temperature.toFixed(1)}°` : '-',
                        box: 'bg-amber-50 dark:bg-amber-900/20',
                        labelTone: 'text-amber-600 dark:text-amber-400',
                        valueTone: 'text-amber-700 dark:text-amber-300',
                      },
                    ].map(stat => (
                      <div
                        key={stat.label}
                        className={`${stat.box} rounded-lg px-1 py-2 sm:px-3 text-center`}
                      >
                        <p className={`text-[11px] sm:text-xs ${stat.labelTone}`}>{stat.label}</p>
                        <p
                          className={`text-base sm:text-lg font-bold tabular-nums ${stat.valueTone}`}
                        >
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Date Filters — 모바일: 월 선택 한 줄 + 시작/종료일 두 칸 */}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3 sm:items-end">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-medium text-foreground mb-1">
                      월 선택
                    </label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={e => handleMonthChange(e.target.value)}
                      className={`${INPUT_CLASS} sm:w-auto sm:px-2 sm:py-1.5`}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs font-medium text-foreground mb-1">시작일</label>
                    <input
                      type="date"
                      value={dateFilterStart}
                      onChange={e => {
                        setDateFilterStart(e.target.value);
                        setReservationPage(1);
                      }}
                      className={`${INPUT_CLASS} sm:w-auto sm:px-2 sm:py-1.5`}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs font-medium text-foreground mb-1">종료일</label>
                    <input
                      type="date"
                      value={dateFilterEnd}
                      onChange={e => {
                        setDateFilterEnd(e.target.value);
                        setReservationPage(1);
                      }}
                      className={`${INPUT_CLASS} sm:w-auto sm:px-2 sm:py-1.5`}
                    />
                  </div>
                  {(dateFilterStart || dateFilterEnd) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="col-span-2 sm:col-span-1"
                      onClick={() => handleMonthChange('')}
                    >
                      초기화
                    </Button>
                  )}
                </div>
              </div>

              {/* Reservations — 데스크톱: 표 / 모바일: 카드 목록 */}
              <div className="flex-1 overflow-auto flex flex-col">
                {isLoadingReservations ? (
                  <div className="p-12 flex justify-center">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : studentReservations.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-sm">
                    조회된 예약 내역이 없습니다.
                  </div>
                ) : (
                  <>
                    {/* 모바일 정렬 (표 헤더가 없으므로 별도 제공) */}
                    <div className="sm:hidden flex items-center gap-2 px-4 py-2 border-b border-border bg-background">
                      <span className="text-xs font-medium text-muted-foreground">정렬</span>
                      <select
                        value={sortKey}
                        onChange={e => {
                          setSortKey(e.target.value as ReservationSortKey);
                          setSortDirection('asc');
                          setReservationPage(1);
                        }}
                        aria-label="정렬 기준"
                        className="min-h-10 flex-1 rounded-md border border-input bg-card px-2 text-base text-foreground dark:bg-gray-700"
                      >
                        {SORT_COLUMNS.map(col => (
                          <option key={col.key} value={col.key}>
                            {col.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleSort(sortKey)}
                        aria-label={sortDirection === 'asc' ? '오름차순' : '내림차순'}
                        className="inline-flex min-h-10 items-center gap-1 rounded-md border border-input px-3 text-sm text-foreground hover:bg-muted/60"
                      >
                        {sortDirection === 'asc' ? (
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        )}
                        {sortDirection === 'asc' ? '오름차순' : '내림차순'}
                      </button>
                    </div>

                    {/* 모바일 카드 목록 */}
                    <ul className="sm:hidden divide-y divide-border">
                      {pagedReservations.map(reservation => (
                        <li key={reservation.id} className="flex items-center gap-2 pl-4 pr-2 py-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground tabular-nums">
                                {format(parseISO(reservation.reservation_date), 'M/d (EEE)', {
                                  locale: ko,
                                })}
                              </span>
                              <AttendanceBadge reservation={reservation} />
                            </div>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {reservation.study_rooms?.name}
                              <span className="mx-1">·</span>
                              <span className="font-semibold text-foreground">
                                {reservation.seat_number}번
                              </span>
                              <span className="mx-1">·</span>
                              {getPeriodLabel(reservation)}
                            </p>
                          </div>
                          {(user?.type === 'teacher' || user?.type === 'admin') && (
                            <div className="flex shrink-0">
                              <button
                                onClick={() => handleEditSeat(reservation)}
                                className="flex h-10 w-10 items-center justify-center rounded-md text-primary-600 hover:bg-muted/60"
                                aria-label="좌석 변경"
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={() => setDeleteOneId(reservation.id)}
                                className="flex h-10 w-10 items-center justify-center rounded-md text-red-600 hover:bg-muted/60"
                                aria-label="삭제"
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* 데스크톱 표 */}
                    <table className="hidden sm:table min-w-full divide-y divide-border">
                      <thead className="bg-background sticky top-0">
                        <tr>
                          {SORT_COLUMNS.map(col => {
                            const isActive = sortKey === col.key;
                            const SortIcon = !isActive
                              ? ArrowUpDown
                              : sortDirection === 'asc'
                                ? ArrowUp
                                : ArrowDown;
                            return (
                              <th
                                key={col.key}
                                aria-sort={
                                  isActive
                                    ? sortDirection === 'asc'
                                      ? 'ascending'
                                      : 'descending'
                                    : 'none'
                                }
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleSort(col.key)}
                                  className={`inline-flex items-center gap-1 uppercase tracking-wider hover:text-foreground ${
                                    isActive ? 'text-foreground' : ''
                                  }`}
                                >
                                  {col.label}
                                  <SortIcon
                                    className={`w-3.5 h-3.5 ${isActive ? '' : 'opacity-40'}`}
                                  />
                                </button>
                              </th>
                            );
                          })}
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            관리
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {pagedReservations.map(reservation => (
                          <tr key={reservation.id} className="hover:bg-muted/60">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                              {reservation.reservation_date}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                              {reservation.study_rooms?.name}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground font-bold">
                              {reservation.seat_number}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                              {getPeriodLabel(reservation)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <AttendanceBadge reservation={reservation} />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                              {(user?.type === 'teacher' || user?.type === 'admin') && (
                                <button
                                  onClick={() => handleEditSeat(reservation)}
                                  className="text-primary-600 hover:text-primary-900 mr-3"
                                  title="좌석 변경"
                                >
                                  <EditIcon />
                                </button>
                              )}
                              {(user?.type === 'teacher' || user?.type === 'admin') && (
                                <button
                                  onClick={() => setDeleteOneId(reservation.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="삭제"
                                >
                                  <DeleteIcon />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
                {/* 페이지네이션 — 모바일은 이전/다음 + 현재 위치만 */}
                {totalReservationPages > 1 && (
                  <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border sm:justify-center sm:px-0">
                    <button
                      onClick={() => setReservationPage(p => Math.max(1, p - 1))}
                      disabled={reservationPage === 1}
                      className="min-h-10 px-4 text-sm rounded-md border border-input disabled:opacity-40 hover:bg-muted/60 dark:text-white sm:min-h-0 sm:px-3 sm:py-1.5"
                    >
                      이전
                    </button>
                    <span className="sm:hidden text-sm tabular-nums text-muted-foreground">
                      <span className="font-semibold text-foreground">{reservationPage}</span> /{' '}
                      {totalReservationPages}
                    </span>
                    <div className="hidden sm:flex items-center gap-2">
                      {Array.from({ length: totalReservationPages }, (_, i) => i + 1)
                        .filter(
                          p =>
                            p === 1 ||
                            p === totalReservationPages ||
                            Math.abs(p - reservationPage) <= 1
                        )
                        .reduce<(number | string)[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, idx) =>
                          typeof item === 'string' ? (
                            <span key={`dot-${idx}`} className="px-1 text-gray-400">
                              ...
                            </span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => setReservationPage(item)}
                              className={`px-3 py-1.5 text-sm rounded-md border ${
                                reservationPage === item
                                  ? 'bg-primary-500 text-white border-primary-500'
                                  : 'border-input hover:bg-muted/60 dark:text-white'
                              }`}
                            >
                              {item}
                            </button>
                          )
                        )}
                    </div>
                    <button
                      onClick={() =>
                        setReservationPage(p => Math.min(totalReservationPages, p + 1))
                      }
                      disabled={reservationPage === totalReservationPages}
                      className="min-h-10 px-4 text-sm rounded-md border border-input disabled:opacity-40 hover:bg-muted/60 dark:text-white sm:min-h-0 sm:px-3 sm:py-1.5"
                    >
                      다음
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {selectedStudent && (
        <AdminReservationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          student={selectedStudent}
          mode={modalMode}
          existingReservation={editingReservation}
          allReservations={studentReservations}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* 날짜별 예약 일괄 삭제 모달 (전역 작업 - 학생 선택과 무관) */}
      <DateBulkDeleteModal
        isOpen={showDateDeleteModal}
        onClose={() => setShowDateDeleteModal(false)}
        onSuccess={(count, dates, grades) => {
          const label =
            dates.length === 1
              ? dates[0]
              : `${dates[0]} 외 ${dates.length - 1}일 (총 ${dates.length}일)`;
          const gradeLabel = grades.length > 0 ? ` ${grades.map(g => `${g}학년`).join('·')}` : '';
          success(`${label}의${gradeLabel} 예약 ${count}건이 삭제되었습니다.`);
          // 현재 보고 있는 학생의 목록에도 영향이 있을 수 있으니 새로고침
          if (selectedStudent) loadStudentReservations();
        }}
      />

      {/* 예약 단건 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={deleteOneId !== null}
        onClose={() => setDeleteOneId(null)}
        onConfirm={handleDeleteOne}
        title="예약 삭제"
        message="이 예약을 삭제하시겠습니까? 삭제된 예약은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      />

      {/* 기간 취소 모달 */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="기간별 예약 취소"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              닫기
            </Button>
            <Button
              variant="danger"
              onClick={handleBulkCancel}
              disabled={cancelTargetReservations.length === 0 || isCancelling}
              isLoading={isCancelling}
            >
              {cancelTargetReservations.length}건 취소
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selectedStudent?.name}</span> 학생의
            예약을 기간으로 선택하여 일괄 취소합니다.
          </p>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1">열람실 (선택)</label>
            <select
              value={cancelRoomId}
              onChange={e => setCancelRoomId(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="">전체 열람실</option>
              {studyRooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">시작일</label>
              <input
                type="date"
                value={cancelStartDate}
                onChange={e => setCancelStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">종료일</label>
              <input
                type="date"
                value={cancelEndDate}
                onChange={e => setCancelEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {cancelStartDate && cancelEndDate && (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="px-3 py-2 bg-background flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">취소 대상 예약</span>
                <span
                  className={`text-xs font-bold ${cancelTargetReservations.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}
                >
                  {cancelTargetReservations.length}건
                </span>
              </div>
              {cancelTargetReservations.length > 0 ? (
                <ul className="divide-y divide-border max-h-48 overflow-y-auto">
                  {cancelTargetReservations.map(r => (
                    <li key={r.id} className="px-3 py-2 text-sm flex items-center justify-between">
                      <span className="text-foreground">{r.reservation_date}</span>
                      <span className="text-muted-foreground text-xs">
                        {r.study_rooms?.name} / {r.seat_number}번
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-3 py-4 text-center text-sm text-gray-400">
                  해당 기간에 예약이 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </Layout>
  );
};
