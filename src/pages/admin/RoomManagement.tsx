import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Layout } from '../../components/common/Layout';
import { Button } from '../../components/common/Button';
import { ConfirmModal } from '../../components/common/Modal';
import { BulkBookingWindowsModal } from '../../components/admin/BulkBookingWindowsModal';
import { BulkOperatingPeriodModal } from '../../components/admin/BulkOperatingPeriodModal';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/common/Toast';
import { copyStudyRoom, toggleStudyRoomStatus } from '../../services/studyRoom.service';
import { useStudyRooms } from '@/contexts/StudyRoomContext';

export const RoomManagement = () => {
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: showError } = useToast();
  const { allStudyRooms: rooms, isLoading, refreshStudyRooms } = useStudyRooms();

  // 인라인 수정 상태
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // 삭제 확인 모달 상태
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const deleteTargetRoom = rooms.find(r => r.id === deleteTargetId) ?? null;

  // 복제 확인 모달 상태
  const [copyTargetId, setCopyTargetId] = useState<string | null>(null);

  // 일괄 수정 상태 (FIXED 방만 선택 가능)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkOperatingModalOpen, setIsBulkOperatingModalOpen] = useState(false);

  // 일괄 수정 가능 대상: 기간제(FIXED) 방만
  const isBulkEligible = (room: { reservation_mode?: string | null }) =>
    room.reservation_mode === 'FIXED';

  useEffect(() => {
    if (editingNameId && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingNameId]);

  const handleInlineNameSave = async (roomId: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) {
      setEditingNameId(null);
      return;
    }
    try {
      const { error } = await supabase
        .from('study_rooms')
        .update({ name: trimmed } as never)
        .eq('id', roomId);
      if (error) throw error;
      refreshStudyRooms();
    } catch {
      showError('이름 변경에 실패했습니다.');
    }
    setEditingNameId(null);
  };

  const handleInlineGradeToggle = async (
    roomId: string,
    currentGrades: number[],
    grade: number
  ) => {
    const next = currentGrades.includes(grade)
      ? currentGrades.filter(g => g !== grade)
      : [...currentGrades, grade].sort();
    if (next.length === 0) return; // 최소 1개
    try {
      const { error } = await supabase
        .from('study_rooms')
        .update({ grades: next, grade: next[0] } as never)
        .eq('id', roomId);
      if (error) throw error;
      refreshStudyRooms();
    } catch {
      showError('학년 변경에 실패했습니다.');
    }
  };

  const handleCreateRoom = () => {
    navigate('/teacher/rooms/new');
  };

  const handleEditRoom = (roomId: string) => {
    navigate(`/teacher/rooms/${roomId}`);
  };

  const handleDeleteRoom = async () => {
    if (!deleteTargetId) return;
    try {
      const { error } = await supabase.from('study_rooms').delete().eq('id', deleteTargetId);
      if (error) throw error;
      success('열람실이 삭제되었습니다.');
      refreshStudyRooms();
    } catch (err) {
      console.error('Error deleting room:', err);
      showError('열람실 삭제에 실패했습니다.');
    } finally {
      setDeleteTargetId(null);
      setDeleteConfirmInput('');
    }
  };

  const handleCopyRoom = async () => {
    if (!copyTargetId) return;
    try {
      await copyStudyRoom(copyTargetId);
      success('열람실이 복제되었습니다.');
      refreshStudyRooms();
    } catch (err) {
      console.error('Error copying room:', err);
      showError('열람실 복제에 실패했습니다.');
    } finally {
      setCopyTargetId(null);
    }
  };

  const handleToggleStatus = async (roomId: string, currentStatus: boolean) => {
    try {
      await toggleStudyRoomStatus(roomId, !currentStatus);
      // Optimistic update or refresh? Refresh ensures consistency.
      refreshStudyRooms();
      success(`열람실이 ${!currentStatus ? '활성화' : '비활성화'}되었습니다.`);
    } catch (err) {
      console.error('Error toggling room status:', err);
      showError('상태 변경에 실패했습니다.');
    }
  };

  // 목록 정렬 (활성 우선 → 이름순)
  const sortedRooms = [...rooms].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return a.name.localeCompare(b.name, 'ko');
  });

  const eligibleRooms = sortedRooms.filter(isBulkEligible);
  const selectedRooms = sortedRooms.filter(r => selectedIds.has(r.id));
  const allEligibleSelected =
    eligibleRooms.length > 0 && eligibleRooms.every(r => selectedIds.has(r.id));

  const toggleSelect = (roomId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(allEligibleSelected ? new Set() : new Set(eligibleRooms.map(r => r.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  return (
    <Layout title="열람실 관리">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="mb-6 flex justify-between items-center gap-3">
        <div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">
                {selectedIds.size}개 선택됨
              </span>
              <Button variant="primary" size="sm" onClick={() => setIsBulkModalOpen(true)}>
                접수 기간 일괄 수정
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsBulkOperatingModalOpen(true)}>
                운영 기간 일괄 수정
              </Button>
              <button
                onClick={clearSelection}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                선택 해제
              </button>
            </div>
          )}
        </div>
        <Button onClick={handleCreateRoom}>
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          열람실 추가
        </Button>
      </div>

      <div className="bg-card shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : rooms.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-foreground">등록된 열람실이 없습니다</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              새로운 열람실을 추가하여 시작하세요.
            </p>
            <div className="mt-6">
              <Button onClick={handleCreateRoom}>열람실 추가</Button>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-background">
              <tr>
                <th scope="col" className="px-6 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={allEligibleSelected}
                    onChange={toggleSelectAll}
                    disabled={eligibleRooms.length === 0}
                    aria-label="기간제 열람실 전체 선택"
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  이름
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  학년
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  예약 방식
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  좌석 수
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  상태
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {sortedRooms.map(room => {
                const eligible = isBulkEligible(room);
                const checked = selectedIds.has(room.id);
                return (
                  <tr
                    key={room.id}
                    className={checked ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(room.id)}
                        disabled={!eligible}
                        aria-label={`${room.name} 선택`}
                        title={
                          eligible ? undefined : '기간제(FIXED) 열람실만 일괄 수정이 가능합니다.'
                        }
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingNameId === room.id ? (
                        <input
                          ref={nameInputRef}
                          type="text"
                          value={editingName}
                          onChange={e => setEditingName(e.target.value)}
                          onBlur={() => handleInlineNameSave(room.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleInlineNameSave(room.id);
                            if (e.key === 'Escape') setEditingNameId(null);
                          }}
                          className="text-sm font-medium text-foreground bg-transparent border-b-2 border-primary-500 outline-none py-0.5 w-full dark:bg-transparent"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingNameId(room.id);
                            setEditingName(room.name);
                          }}
                          className="text-sm font-medium text-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer text-left"
                          title="클릭하여 이름 수정"
                        >
                          {room.name}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-1">
                        {[1, 2, 3].map(g => {
                          const grades =
                            room.grades && room.grades.length > 0 ? room.grades : [room.grade || 1];
                          const isSelected = grades.includes(g);
                          return (
                            <button
                              key={g}
                              onClick={() => handleInlineGradeToggle(room.id, grades, g)}
                              className={`w-7 h-7 rounded-md text-xs font-medium border transition-all ${
                                isSelected
                                  ? 'bg-primary-50 border-primary-400 text-primary-700 dark:bg-primary-900/30 dark:border-primary-500 dark:text-primary-300'
                                  : 'bg-muted border-border text-muted-foreground hover:border-gray-300'
                              }`}
                              title={`${g}학년 ${isSelected ? '제거' : '추가'}`}
                            >
                              {g}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            room.reservation_mode === 'FIXED'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}
                        >
                          {room.reservation_mode === 'FIXED' ? '기간제' : '주 단위'}
                        </span>
                        {/* 설정 상세 팝오버 */}
                        <div className="relative group/settings">
                          <button className="p-1 text-gray-400 hover:text-foreground transition-colors">
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
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover/settings:opacity-100 group-hover/settings:visible transition-all duration-200 z-50 pointer-events-none">
                            <div className="space-y-1.5">
                              {/* 운영 요일 */}
                              <div className="flex justify-between">
                                <span className="text-gray-400">운영 요일</span>
                                <span>
                                  {(() => {
                                    const days =
                                      room.operating_days && room.operating_days.length > 0
                                        ? room.operating_days
                                        : (() => {
                                            const d = [1, 2, 3, 4, 5];
                                            if (room.is_saturday_open) d.push(6);
                                            if (room.is_sunday_open) d.push(0);
                                            return d;
                                          })();
                                    const labels: Record<number, string> = {
                                      0: '일',
                                      1: '월',
                                      2: '화',
                                      3: '수',
                                      4: '목',
                                      5: '금',
                                      6: '토',
                                    };
                                    const order = [1, 2, 3, 4, 5, 6, 0];
                                    return order
                                      .filter(d => days.includes(d))
                                      .map(d => labels[d])
                                      .join(' ');
                                  })()}
                                </span>
                              </div>
                              {/* 운영 기간 */}
                              {(room.fixed_start_date || room.fixed_end_date) && (
                                <div className="flex justify-between">
                                  <span className="text-gray-400">운영 기간</span>
                                  <span>
                                    {room.fixed_start_date?.slice(5)} ~{' '}
                                    {room.fixed_end_date?.slice(5)}
                                  </span>
                                </div>
                              )}
                              {/* 예약 접수 기간 (FIXED) */}
                              {room.reservation_mode === 'FIXED' &&
                                (room.booking_windows?.length || room.booking_start_date) && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">접수 기간</span>
                                    <span>
                                      {room.booking_windows && room.booking_windows.length > 0
                                        ? `${room.booking_windows.length}개 설정`
                                        : room.booking_start_date
                                          ? `${room.booking_start_date.slice(5, 16)} ~`
                                          : '-'}
                                    </span>
                                  </div>
                                )}
                              {/* 교시 */}
                              <div className="flex justify-between">
                                <span className="text-gray-400">교시</span>
                                <span>
                                  {room.use_periods && room.operating_periods?.length
                                    ? `${room.operating_periods.length}교시 (${room.period_booking_mode === 'INDIVIDUAL' ? '개별선택' : '일괄'})`
                                    : '미사용'}
                                </span>
                              </div>
                              {/* 중복 신청 */}
                              <div className="flex justify-between">
                                <span className="text-gray-400">중복 신청</span>
                                <span>{room.allow_duplicate_reservation ? '허용' : '불가'}</span>
                              </div>
                              {/* 규칙 */}
                              {room.rules && (
                                <div className="pt-1.5 mt-1.5 border-t border-gray-700 dark:border-gray-600">
                                  <span className="text-gray-400">규칙: </span>
                                  <span className="text-gray-300">
                                    {room.rules.length > 50
                                      ? room.rules.slice(0, 50) + '...'
                                      : room.rules}
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* 화살표 */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">{room.total_seats}석</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(room.id, room.is_active)}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
                          room.is_active ? 'bg-green-500' : 'bg-muted'
                        }`}
                      >
                        <span className="sr-only">Use setting</span>
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            room.is_active ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditRoom(room.id)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => setCopyTargetId(room.id)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        복제
                      </button>
                      <button
                        onClick={() => {
                          setDeleteTargetId(room.id);
                          setDeleteConfirmInput('');
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {/* 열람실 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => {
          setDeleteTargetId(null);
          setDeleteConfirmInput('');
        }}
        onConfirm={handleDeleteRoom}
        title="열람실 삭제"
        message={`"${deleteTargetRoom?.name}" 열람실을 삭제하면 관련된 모든 예약 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.\n\n계속하려면 열람실 이름을 입력하세요.`}
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        confirmDisabled={deleteConfirmInput !== (deleteTargetRoom?.name ?? '')}
      >
        <div className="mt-3">
          <input
            type="text"
            value={deleteConfirmInput}
            onChange={e => setDeleteConfirmInput(e.target.value)}
            placeholder={deleteTargetRoom?.name ?? ''}
            className="w-full px-3 py-2 border border-input rounded-md text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </ConfirmModal>

      {/* 열람실 복제 확인 모달 */}
      <ConfirmModal
        isOpen={copyTargetId !== null}
        onClose={() => setCopyTargetId(null)}
        onConfirm={handleCopyRoom}
        title="열람실 복제"
        message={`"${rooms.find(r => r.id === copyTargetId)?.name}" 열람실을 복제하시겠습니까?\n\n좌석 배치 및 설정이 복사되며, 예약 데이터는 복사되지 않습니다.`}
        confirmText="복제"
        cancelText="취소"
        variant="primary"
      />

      {/* 접수 기간 일괄 수정 모달 */}
      <BulkBookingWindowsModal
        isOpen={isBulkModalOpen}
        selectedRooms={selectedRooms}
        onClose={() => setIsBulkModalOpen(false)}
        onApplied={() => {
          refreshStudyRooms();
          clearSelection();
        }}
        onSuccess={success}
        onError={showError}
      />

      {/* 운영 기간 일괄 수정 모달 */}
      <BulkOperatingPeriodModal
        isOpen={isBulkOperatingModalOpen}
        selectedRooms={selectedRooms}
        onClose={() => setIsBulkOperatingModalOpen(false)}
        onApplied={() => {
          refreshStudyRooms();
          clearSelection();
        }}
        onSuccess={success}
        onError={showError}
      />
    </Layout>
  );
};
