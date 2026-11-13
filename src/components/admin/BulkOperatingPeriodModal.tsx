import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { StudyRoom } from '../../types/reservation.types';

interface BulkOperatingPeriodModalProps {
  isOpen: boolean;
  /** 일괄 수정 대상 열람실 (FIXED 모드만 전달됨) */
  selectedRooms: StudyRoom[];
  onClose: () => void;
  /** 저장 완료(부분 성공 포함) 후 호출 — 목록 새로고침 및 선택 초기화용 */
  onApplied: () => void;
  /** 결과/오류 알림 콜백 */
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

/**
 * 여러 열람실의 운영 기간(fixed_start_date ~ fixed_end_date)을 한 번에 수정한다.
 * 입력한 운영 기간으로 선택된 각 방의 기존 운영 기간을 완전히 대체한다.
 */
export const BulkOperatingPeriodModal = ({
  isOpen,
  selectedRooms,
  onClose,
  onApplied,
  onSuccess,
  onError,
}: BulkOperatingPeriodModalProps) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 모달이 열릴 때마다 입력 초기화 (일괄 입력은 새로 작성)
  useEffect(() => {
    if (isOpen) {
      setStartDate('');
      setEndDate('');
    }
  }, [isOpen]);

  const handleApply = async () => {
    if (selectedRooms.length === 0) return;

    if (!startDate || !endDate) {
      onError('운영 시작일과 종료일을 모두 입력해주세요.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      onError('운영 종료일은 시작일과 같거나 이후여야 합니다.');
      return;
    }

    setIsSaving(true);
    const payload = {
      fixed_start_date: startDate,
      fixed_end_date: endDate,
    };

    let ok = 0;
    let fail = 0;
    for (const room of selectedRooms) {
      const { error } = await supabase
        .from('study_rooms')
        .update(payload as never)
        .eq('id', room.id);
      if (error) {
        console.error(`운영 기간 일괄 수정 실패 (${room.name}):`, error);
        fail++;
      } else {
        ok++;
      }
    }

    setIsSaving(false);

    if (fail === 0) {
      onSuccess(`${ok}개 열람실의 운영 기간이 수정되었습니다.`);
    } else {
      onError(`${ok}개 성공, ${fail}개 실패했습니다.`);
    }

    onApplied();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="운영 기간 일괄 수정"
      size="lg"
      closeOnOverlayClick={!isSaving}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            isLoading={isSaving}
            disabled={isSaving || !startDate || !endDate}
          >
            {selectedRooms.length}개 열람실에 적용
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* 선택된 열람실 */}
        <div className="rounded-lg bg-primary-50 dark:bg-primary-900/20 p-3">
          <div className="text-sm font-medium text-primary-800 dark:text-primary-200 mb-1">
            선택된 열람실 {selectedRooms.length}개
          </div>
          <div className="text-xs text-primary-700 dark:text-primary-300">
            {selectedRooms.map(r => r.name).join(', ')}
          </div>
        </div>

        {/* 완전 대체 경고 */}
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>
            여기에 입력한 운영 기간이 선택된 열람실의 <strong>기존 운영 기간을 완전히 대체</strong>
            합니다.
          </span>
        </div>

        {/* 운영 기간 입력 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">운영 시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">운영 종료일</label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={e => setEndDate(e.target.value)}
              className="block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
