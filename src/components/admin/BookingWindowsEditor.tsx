import { useState } from 'react';
import { Button } from '../common/Button';
import type { BookingWindow } from '../../types/reservation.types';

interface BookingWindowsEditorProps {
  /** 현재 접수 기간(차수) 목록 */
  value: BookingWindow[];
  /** 목록이 변경될 때 호출 */
  onChange: (windows: BookingWindow[]) => void;
  /** 검증 실패 등 사용자에게 알릴 메시지 */
  onError?: (message: string) => void;
}

/**
 * 예약 접수 기간(booking_windows)을 추가/수정/삭제하는 제어 컴포넌트.
 * RoomEditor 단일 수정과 BulkBookingWindowsModal 일괄 수정에서 공용으로 사용한다.
 */
export const BookingWindowsEditor = ({ value, onChange, onError }: BookingWindowsEditorProps) => {
  const [editingWindowId, setEditingWindowId] = useState<number | null>(null);
  const [editingWindow, setEditingWindow] = useState<BookingWindow | null>(null);
  const [newWindow, setNewWindow] = useState({ label: '', start: '', end: '' });

  const handleAddWindow = () => {
    if (!newWindow.start || !newWindow.end) {
      onError?.('접수 시작 및 마감 일시를 모두 입력해주세요.');
      return;
    }
    if (new Date(newWindow.start) >= new Date(newWindow.end)) {
      onError?.('접수 마감이 시작보다 이후여야 합니다.');
      return;
    }
    const newId = value.length > 0 ? Math.max(...value.map(w => w.id)) + 1 : 1;
    onChange([
      ...value,
      {
        id: newId,
        label: newWindow.label || `${newId}차 접수`,
        start: newWindow.start,
        end: newWindow.end,
      },
    ]);
    setNewWindow({ label: '', start: '', end: '' });
  };

  return (
    <div className="space-y-3">
      {/* 기존 접수 기간 목록 */}
      {value.map((w, index) => (
        <div key={w.id} className="flex items-start gap-3 bg-muted/50 p-3 rounded-lg">
          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary-100 dark:bg-primary-900/30 rounded-full text-sm font-medium text-primary-700 dark:text-primary-300">
            {index + 1}
          </div>

          {editingWindowId === w.id && editingWindow ? (
            <>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={editingWindow.label || ''}
                  onChange={e => setEditingWindow({ ...editingWindow, label: e.target.value })}
                  className="block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  placeholder="접수 차수 이름 (예: 1차 접수)"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">접수 시작</label>
                    <input
                      type="datetime-local"
                      value={editingWindow.start}
                      onChange={e => setEditingWindow({ ...editingWindow, start: e.target.value })}
                      className="block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">접수 마감</label>
                    <input
                      type="datetime-local"
                      value={editingWindow.end}
                      onChange={e => setEditingWindow({ ...editingWindow, end: e.target.value })}
                      className="block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!editingWindow.start || !editingWindow.end) {
                      onError?.('접수 시작 및 마감 일시를 모두 입력해주세요.');
                      return;
                    }
                    if (new Date(editingWindow.start) >= new Date(editingWindow.end)) {
                      onError?.('접수 마감이 시작보다 이후여야 합니다.');
                      return;
                    }
                    onChange(value.map(bw => (bw.id === editingWindowId ? editingWindow : bw)));
                    setEditingWindowId(null);
                    setEditingWindow(null);
                  }}
                >
                  완료
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingWindowId(null);
                    setEditingWindow(null);
                  }}
                >
                  취소
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex-1">
                <div className="font-medium text-foreground text-sm">
                  {w.label || `${index + 1}차 접수`}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {w.start ? new Date(w.start).toLocaleString('ko-KR') : '(시작 미설정)'}
                  {' ~ '}
                  {w.end ? new Date(w.end).toLocaleString('ko-KR') : '(마감 미설정)'}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingWindowId(w.id);
                    setEditingWindow(w);
                  }}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-muted rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  onClick={() => onChange(value.filter(bw => bw.id !== w.id))}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      {/* 새 접수 기간 추가 폼 */}
      <div className="p-4 bg-muted/30 border border-dashed border-input rounded-lg">
        <h4 className="text-sm font-medium text-foreground mb-3">새 접수 기간 추가</h4>
        <div className="space-y-3">
          <input
            type="text"
            value={newWindow.label}
            onChange={e => setNewWindow({ ...newWindow, label: e.target.value })}
            className="block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            placeholder="접수 차수 이름 (예: 1차 접수, 추가 접수)"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">접수 시작 일시</label>
              <input
                type="datetime-local"
                value={newWindow.start}
                onChange={e => setNewWindow({ ...newWindow, start: e.target.value })}
                className="block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">접수 마감 일시</label>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={newWindow.end}
                  onChange={e => setNewWindow({ ...newWindow, end: e.target.value })}
                  className="block w-full rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                />
                <Button size="sm" onClick={handleAddWindow}>
                  추가
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
