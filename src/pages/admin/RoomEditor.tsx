import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Layout } from '../../components/common/Layout';
import { Button } from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/common/Toast';
import { SeatLayoutEditor } from '../../components/admin/SeatLayoutEditor';
import { BookingWindowsEditor } from '../../components/admin/BookingWindowsEditor';
import type {
  SeatLayout,
  StudyRoom,
  OperatingPeriod,
  BookingWindow,
} from '../../types/reservation.types';

export const RoomEditor = () => {
  console.log('RoomEditor rendering');
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: showError } = useToast();
  const isEditMode = roomId && roomId !== 'new';

  const [name, setName] = useState('');
  const [grades, setGrades] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [rules, setRules] = useState('');
  const [operatingDays, setOperatingDays] = useState<number[]>([1, 2, 3, 4, 5]); // 기본: 평일
  const [layout, setLayout] = useState<SeatLayout>({
    totalRows: 5,
    totalColumns: 5,
    sections: [{ startRow: 0, startCol: 0, rows: 5, columns: 5 }],
    emptySeats: [],
  });
  const [reservationMode, setReservationMode] = useState<'WEEKLY' | 'FIXED'>('WEEKLY');
  const [fixedStartDate, setFixedStartDate] = useState('');
  const [fixedEndDate, setFixedEndDate] = useState('');
  const [bookingWindows, setBookingWindows] = useState<BookingWindow[]>([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  const [useOperatingPeriod, setUseOperatingPeriod] = useState(false);

  // 교시 설정 상태
  const [usePeriods, setUsePeriods] = useState(false);
  const [operatingPeriods, setOperatingPeriods] = useState<OperatingPeriod[]>([]);

  // 교시 신청 방식 설정
  const [periodBookingMode, setPeriodBookingMode] = useState<'ALL_AT_ONCE' | 'INDIVIDUAL'>(
    'ALL_AT_ONCE'
  );
  const [dayPeriodMode, setDayPeriodMode] = useState<'UNIFORM' | 'PER_DAY'>('UNIFORM');
  const [allowDuplicateReservation, setAllowDuplicateReservation] = useState(false);
  const [isSungong, setIsSungong] = useState(false);

  // 교시 수정/추가 관리 상태
  const [editingPeriodId, setEditingPeriodId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<OperatingPeriod | null>(null);
  const [newPeriod, setNewPeriod] = useState({ name: '', start_time: '09:00', end_time: '10:00' });

  useEffect(() => {
    if (reservationMode === 'FIXED') {
      setUseOperatingPeriod(true);
    }
  }, [reservationMode]);

  useEffect(() => {
    if (isEditMode) {
      fetchRoom(roomId);
    }
  }, [roomId, isEditMode]);

  const fetchRoom = async (id: string) => {
    console.log('Fetching room:', id);
    try {
      const { data, error } = await supabase.from('study_rooms').select('*').eq('id', id).single();

      if (error) throw error;
      if (data) {
        const room = data as unknown as StudyRoom;
        setName(room.name);
        setGrades(room.grades && room.grades.length > 0 ? room.grades : [room.grade || 1]);
        setIsActive(room.is_active);
        setRules(room.rules || '');
        // operating_days 로드 (레거시 호환)
        if (room.operating_days && room.operating_days.length > 0) {
          setOperatingDays(room.operating_days);
        } else {
          const days = [1, 2, 3, 4, 5];
          if (room.is_saturday_open) days.push(6);
          if (room.is_sunday_open) days.push(0);
          setOperatingDays(days);
        }
        setReservationMode(room.reservation_mode || 'WEEKLY');
        setFixedStartDate(room.fixed_start_date || '');
        setFixedEndDate(room.fixed_end_date || '');
        setUseOperatingPeriod(
          !!(room.fixed_start_date || room.fixed_end_date) || room.reservation_mode === 'FIXED'
        );

        // 교시 설정 불러오기
        setUsePeriods(room.use_periods || false);
        setOperatingPeriods(room.operating_periods || []);
        setPeriodBookingMode(room.period_booking_mode || 'ALL_AT_ONCE');
        setDayPeriodMode(room.day_period_mode || 'UNIFORM');
        setAllowDuplicateReservation(room.allow_duplicate_reservation || false);
        setIsSungong(room.is_sungong || false);

        // booking_windows 로드 (레거시 호환: 기존 단일 값 → 배열 변환)
        if (room.booking_windows && room.booking_windows.length > 0) {
          setBookingWindows(
            room.booking_windows.map((w: BookingWindow) => ({
              ...w,
              start: w.start.slice(0, 16),
              end: w.end.slice(0, 16),
            }))
          );
        } else if (room.booking_start_date || room.booking_end_date) {
          setBookingWindows([
            {
              id: 1,
              label: '1차 접수',
              start: room.booking_start_date ? room.booking_start_date.slice(0, 16) : '',
              end: room.booking_end_date ? room.booking_end_date.slice(0, 16) : '',
            },
          ]);
        }
        const defaultLayout: SeatLayout = {
          totalRows: 5,
          totalColumns: 5,
          sections: [{ startRow: 0, startCol: 0, rows: 5, columns: 5 }],
          emptySeats: [],
        };
        setLayout((room.seat_layout as SeatLayout) || defaultLayout);
      }
    } catch (err) {
      console.error('Error fetching room:', err);
      showError('열람실 정보를 불러오는데 실패했습니다.');
      navigate('/teacher/rooms');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalSeats = (l: SeatLayout) => {
    let total = 0;
    // Count all cells in sections
    l.sections.forEach(s => {
      total += s.rows * s.columns;
    });
    // Subtract empty seats
    if (l.emptySeats) {
      total -= l.emptySeats.length;
    }
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      showError('열람실 이름을 입력해주세요.');
      return;
    }
    if (grades.length === 0) {
      showError('최소 하나의 학년을 선택해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const roomData = {
        name,
        grades,
        grade: grades[0], // Legacy support
        is_active: isActive,
        rules,
        operating_days: operatingDays,
        is_saturday_open: operatingDays.includes(6),
        is_sunday_open: operatingDays.includes(0),
        seat_layout: layout,
        total_seats: calculateTotalSeats(layout),
        reservation_mode: reservationMode,
        fixed_start_date: useOperatingPeriod && fixedStartDate ? fixedStartDate : null,
        fixed_end_date: useOperatingPeriod && fixedEndDate ? fixedEndDate : null,
        booking_windows:
          reservationMode === 'FIXED' && bookingWindows.length > 0
            ? bookingWindows.map(w => ({
                ...w,
                start: w.start || '',
                end: w.end || '',
              }))
            : [],
        // 레거시 호환: 첫 번째 window를 단일 필드에도 저장
        booking_start_date:
          reservationMode === 'FIXED' && bookingWindows.length > 0 && bookingWindows[0].start
            ? bookingWindows[0].start
            : null,
        booking_end_date:
          reservationMode === 'FIXED' && bookingWindows.length > 0 && bookingWindows[0].end
            ? bookingWindows[0].end
            : null,
        use_periods: usePeriods,
        operating_periods: usePeriods ? operatingPeriods : [],
        period_booking_mode: usePeriods ? periodBookingMode : 'ALL_AT_ONCE',
        day_period_mode:
          usePeriods && periodBookingMode === 'INDIVIDUAL' ? dayPeriodMode : 'UNIFORM',
        allow_duplicate_reservation: allowDuplicateReservation,
        is_sungong: isSungong,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('study_rooms')
          .update(roomData as unknown as never)
          .eq('id', roomId);
        if (error) throw error;
        success('열람실이 수정되었습니다.');
      } else {
        const { error } = await supabase
          .from('study_rooms')
          .insert(roomData as any)
          .select()
          .single();

        if (error) throw error;
        success('열람실이 생성되었습니다.');
      }

      setTimeout(() => navigate('/teacher/rooms'), 1000);
    } catch (err: any) {
      console.error('Error saving room:', err);
      const errorMessage = err.message || err.error_description || '저장에 실패했습니다.';
      showError(`저장 실패: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={isEditMode ? '열람실 수정' : '새 열람실 생성'}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 기본 정보 */}
        <div className="bg-card shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">열람실 이름</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                placeholder="예: 1학년 면학실"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">grades</label>
              <div className="mt-1 space-y-2">
                {[1, 2, 3].map(g => (
                  <div key={g} className="flex items-center">
                    <input
                      id={`grade-${g}`}
                      type="checkbox"
                      checked={grades.includes(g)}
                      onChange={e => {
                        if (e.target.checked) {
                          setGrades([...grades, g].sort());
                        } else {
                          setGrades(grades.filter(g_ => g_ !== g));
                        }
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`grade-${g}`}
                      className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
                    >
                      {g}학년
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <input
              id="is_active"
              type="checkbox"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label
              htmlFor="is_active"
              className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
            >
              활성화 (학생들에게 표시됨)
            </label>
          </div>
          <div className="flex items-center mt-2">
            <input
              id="allow_duplicate_reservation"
              type="checkbox"
              checked={allowDuplicateReservation}
              onChange={e => setAllowDuplicateReservation(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label
              htmlFor="allow_duplicate_reservation"
              className="ml-2 block text-sm text-gray-900 dark:text-gray-300"
            >
              중복 신청 허용 (다른 열람실에 예약이 있어도 이 열람실에 신청 가능)
            </label>
          </div>

          {/* 순공(방학학습) 설정 */}
          <div className="mt-4 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 p-4">
            <div className="flex items-center">
              <input
                id="is_sungong"
                type="checkbox"
                checked={isSungong}
                onChange={e => setIsSungong(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="is_sungong"
                className="ml-2 block text-sm font-medium text-indigo-900 dark:text-indigo-200"
              >
                순공(방학학습) 열람실로 설정
              </label>
            </div>
            <p className="mt-1 ml-6 text-xs text-indigo-700/80 dark:text-indigo-300/80">
              좌석 배치에서 좌석별 A반/B반을 지정할 수 있고, 순공 대상자 명단·출석 통계·출석부
              다운로드가 활성화됩니다.
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <label className="block text-sm font-medium text-foreground mb-2">운영 요일</label>
            {/* 프리셋 버튼 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                { label: '평일 (월~금)', days: [1, 2, 3, 4, 5] },
                { label: '평일+토', days: [1, 2, 3, 4, 5, 6] },
                { label: '토요일만', days: [6] },
                { label: '매일', days: [0, 1, 2, 3, 4, 5, 6] },
              ].map(preset => {
                const isActive =
                  preset.days.length === operatingDays.length &&
                  preset.days.every(d => operatingDays.includes(d));
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setOperatingDays(preset.days)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      isActive
                        ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:border-primary-500 dark:text-primary-300'
                        : 'bg-white border-input text-muted-foreground hover:bg-muted dark:hover:bg-gray-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            {/* 개별 요일 토글 */}
            <div className="flex gap-2">
              {[
                { day: 1, label: '월' },
                { day: 2, label: '화' },
                { day: 3, label: '수' },
                { day: 4, label: '목' },
                { day: 5, label: '금' },
                { day: 6, label: '토' },
                { day: 0, label: '일' },
              ].map(({ day, label }) => {
                const isSelected = operatingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        const next = operatingDays.filter(d => d !== day);
                        if (next.length > 0) setOperatingDays(next);
                      } else {
                        setOperatingDays([...operatingDays, day].sort((a, b) => a - b));
                      }
                    }}
                    className={`w-10 h-10 rounded-lg text-sm font-medium border-2 transition-all ${
                      isSelected
                        ? day === 0
                          ? 'bg-red-50 border-red-400 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-300'
                          : day === 6
                            ? 'bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300'
                            : 'bg-primary-50 border-primary-400 text-primary-700 dark:bg-primary-900/20 dark:border-primary-500 dark:text-primary-300'
                        : 'bg-muted border-border text-muted-foreground '
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {operatingDays.length === 0 && (
              <p className="mt-2 text-xs text-red-500">최소 하나의 운영 요일을 선택해주세요.</p>
            )}
          </div>
          {/* 규칙 입력 (전체 너비) */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-foreground">열람실 이용 규칙</label>
            <textarea
              value={rules}
              onChange={e => setRules(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700"
              placeholder="열람실 이용 시 주의사항이나 규칙을 입력해주세요. (줄바꿈 가능)"
            />
          </div>
        </div>

        {/* 예약 설정 */}
        <div className="bg-card shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">예약 설정</h2>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground">예약 방식</label>
              <select
                value={reservationMode}
                onChange={e => setReservationMode(e.target.value as 'WEEKLY' | 'FIXED')}
                className="mt-1 block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700"
              >
                <option value="WEEKLY">주 단위 예약 (매주 리셋)</option>
                <option value="FIXED">기간제 예약 (학기/기간 단위)</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">운영 기간 설정</h3>
              {reservationMode === 'WEEKLY' && (
                <div className="flex items-center">
                  <input
                    id="use_operating_period"
                    type="checkbox"
                    checked={useOperatingPeriod}
                    onChange={e => setUseOperatingPeriod(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="use_operating_period"
                    className="ml-2 block text-sm text-foreground dark:text-gray-300"
                  >
                    사용함
                  </label>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  운영 시작일 ({reservationMode === 'WEEKLY' ? '선택' : '필수'})
                </label>
                <input
                  type="date"
                  value={fixedStartDate}
                  onChange={e => setFixedStartDate(e.target.value)}
                  disabled={!useOperatingPeriod}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:text-white
 ${
   !useOperatingPeriod
     ? 'bg-muted text-gray-500 border-input cursor-not-allowed'
     : 'border-input dark:bg-gray-700 '
 }`}
                />
                {reservationMode === 'WEEKLY' && (
                  <p className="mt-1 text-xs text-gray-500">
                    설정 시 해당 기간 내의 주차만 예약 가능합니다.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">
                  운영 종료일 ({reservationMode === 'WEEKLY' ? '선택' : '필수'})
                </label>
                <input
                  type="date"
                  value={fixedEndDate}
                  onChange={e => setFixedEndDate(e.target.value)}
                  disabled={!useOperatingPeriod}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:text-white
 ${
   !useOperatingPeriod
     ? 'bg-muted text-gray-500 border-input cursor-not-allowed'
     : 'border-input dark:bg-gray-700 '
 }`}
                />
              </div>
            </div>

            {reservationMode === 'FIXED' && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">
                  예약 접수 기간 ({bookingWindows.length}개)
                </h3>

                <BookingWindowsEditor
                  value={bookingWindows}
                  onChange={setBookingWindows}
                  onError={showError}
                />
              </div>
            )}

            {/* 교시 설정 */}
            <div className="pt-6 border-t border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <input
                    id="use_periods"
                    type="checkbox"
                    checked={usePeriods}
                    onChange={e => setUsePeriods(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="use_periods"
                    className="ml-2 block text-sm font-medium text-foreground"
                  >
                    교시(Period) 사용
                  </label>
                </div>
              </div>

              {usePeriods && (
                <div className="space-y-3">
                  {/* Existing Periods List */}
                  {operatingPeriods.map((period, index) => (
                    <div
                      key={period.id}
                      className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-muted rounded-full text-sm font-medium text-muted-foreground">
                        {index + 1}
                      </div>

                      {editingPeriodId === period.id && editForm ? (
                        // Edit Mode
                        <>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                              className="block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                              placeholder="교시명"
                            />
                            <div className="flex items-center gap-2 col-span-2">
                              <input
                                type="time"
                                value={editForm.start_time}
                                onChange={e =>
                                  setEditForm({ ...editForm, start_time: e.target.value })
                                }
                                className="block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                              />
                              <span className="text-gray-500">-</span>
                              <input
                                type="time"
                                value={editForm.end_time}
                                onChange={e =>
                                  setEditForm({ ...editForm, end_time: e.target.value })
                                }
                                className="block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const newPeriods = operatingPeriods.map(p =>
                                  p.id === editingPeriodId ? editForm : p
                                );
                                setOperatingPeriods(newPeriods);
                                setEditingPeriodId(null);
                                setEditForm(null);
                              }}
                            >
                              완료
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingPeriodId(null);
                                setEditForm(null);
                              }}
                            >
                              취소
                            </Button>
                          </div>
                        </>
                      ) : (
                        // View Mode
                        <>
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                            <div className="font-medium text-foreground">{period.name}</div>
                            <div className="col-span-2 text-sm text-muted-foreground">
                              {period.start_time} - {period.end_time}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPeriodId(period.id);
                                setEditForm(period);
                              }}
                              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-muted rounded-full transition-colors"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOperatingPeriods(
                                  operatingPeriods.filter(p => p.id !== period.id)
                                );
                              }}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Add New Period Form */}
                  <div className="mt-4 p-4 bg-muted/30 border border-dashed border-input rounded-lg">
                    <h4 className="text-sm font-medium text-foreground mb-3">새 교시 추가</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newPeriod.name}
                        onChange={e => setNewPeriod({ ...newPeriod, name: e.target.value })}
                        className="block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="교시명 (예: 1교시)"
                      />
                      <div className="flex items-center gap-2 col-span-2">
                        <input
                          type="time"
                          value={newPeriod.start_time}
                          onChange={e => setNewPeriod({ ...newPeriod, start_time: e.target.value })}
                          className="block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="time"
                          value={newPeriod.end_time}
                          onChange={e => setNewPeriod({ ...newPeriod, end_time: e.target.value })}
                          className="block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!newPeriod.name) {
                              showError('교시 이름을 입력해주세요.');
                              return;
                            }
                            const newId =
                              operatingPeriods.length > 0
                                ? Math.max(...operatingPeriods.map(p => p.id)) + 1
                                : 1;
                            setOperatingPeriods([...operatingPeriods, { id: newId, ...newPeriod }]);
                            setNewPeriod({ name: '', start_time: '09:00', end_time: '10:00' });
                          }}
                        >
                          추가
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 교시 신청 방식 설정 */}
                  <div className="mt-4 p-4 bg-muted/30 border border-border rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        교시 신청 방식
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="periodBookingMode"
                            value="ALL_AT_ONCE"
                            checked={periodBookingMode === 'ALL_AT_ONCE'}
                            onChange={() => setPeriodBookingMode('ALL_AT_ONCE')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-900 dark:text-gray-300">
                            모든 교시 일괄 신청
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            (학생이 교시를 선택할 수 없음)
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="periodBookingMode"
                            value="INDIVIDUAL"
                            checked={periodBookingMode === 'INDIVIDUAL'}
                            onChange={() => setPeriodBookingMode('INDIVIDUAL')}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-900 dark:text-gray-300">
                            교시 개별 선택
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            (학생이 원하는 교시를 선택)
                          </span>
                        </label>
                      </div>
                    </div>

                    {periodBookingMode === 'INDIVIDUAL' && (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          요일별 교시 설정
                        </label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="dayPeriodMode"
                              value="UNIFORM"
                              checked={dayPeriodMode === 'UNIFORM'}
                              onChange={() => setDayPeriodMode('UNIFORM')}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-900 dark:text-gray-300">
                              모든 요일 동일
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              (선택한 교시가 모든 요일에 적용)
                            </span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="dayPeriodMode"
                              value="PER_DAY"
                              checked={dayPeriodMode === 'PER_DAY'}
                              onChange={() => setDayPeriodMode('PER_DAY')}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-900 dark:text-gray-300">
                              요일별 개별 설정
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              (요일마다 다른 교시 선택 가능)
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 좌석 배치 */}
        <div className="bg-card shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-foreground mb-4">좌석 배치 설정</h2>
          <SeatLayoutEditor initialLayout={layout} onChange={setLayout} showZones={isSungong} />
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => navigate('/teacher/rooms')}>
            취소
          </Button>
          <Button variant="primary" type="submit" isLoading={isSaving}>
            {isEditMode ? '수정 완료' : '생성 완료'}
          </Button>
        </div>
      </form>
    </Layout>
  );
};
