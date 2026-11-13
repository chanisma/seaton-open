import { useState, useEffect } from 'react';
import { Layout } from '@components/common/Layout';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Modal } from '@components/common/Modal';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { ToastContainer } from '@components/common/Toast';
import { useToast } from '@hooks/useToast';
import {
  getAllPuzzleEvents,
  createPuzzleEvent,
  updatePuzzleEvent,
  deletePuzzleEvent,
  getEventStatus,
  getPuzzleOwnerCounts,
} from '@services/puzzle.service';
import { validateImageFile } from '@utils/puzzleImageSplitter';
import type { PuzzleEvent, PuzzleGridSize } from '@project-types/puzzle.types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Plus,
  Puzzle,
  Trash2,
  Edit2,
  Calendar,
  Image,
  Coins,
  ToggleLeft,
  ToggleRight,
  Users,
} from 'lucide-react';

interface EventFormData {
  title: string;
  description: string;
  gridSize: PuzzleGridSize;
  pieceCost: number;
  startDate: string;
  endDate: string;
  imageFile: File | null;
}

const initialFormData: EventFormData = {
  title: '',
  description: '',
  gridSize: '4x3',
  pieceCost: 10,
  startDate: '',
  endDate: '',
  imageFile: null,
};

interface EditFormData {
  title: string;
  description: string;
  pieceCost: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export const PuzzleManagementPage = () => {
  const { success, error: toastError, toasts, removeToast } = useToast();
  const [events, setEvents] = useState<PuzzleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 수정 관련 상태
  const [editingEvent, setEditingEvent] = useState<PuzzleEvent | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    title: '',
    description: '',
    pieceCost: 10,
    startDate: '',
    endDate: '',
    isActive: true,
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [ownerCounts, setOwnerCounts] = useState<Record<string, number>>({});

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const [data, counts] = await Promise.all([getAllPuzzleEvents(), getPuzzleOwnerCounts()]);
      setEvents(data);
      setOwnerCounts(counts);
    } catch (err) {
      console.error('Failed to load events:', err);
      toastError('이벤트 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toastError(validationError);
      return;
    }

    setFormData(prev => ({ ...prev, imageFile: file }));

    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async () => {
    if (!formData.title.trim()) {
      toastError('제목을 입력해주세요.');
      return;
    }
    if (!formData.imageFile) {
      toastError('이미지를 선택해주세요.');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toastError('시작일과 종료일을 설정해주세요.');
      return;
    }
    if (formData.startDate > formData.endDate) {
      toastError('종료일은 시작일 이후여야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createPuzzleEvent({
        title: formData.title.trim(),
        description: formData.description.trim(),
        imageFile: formData.imageFile,
        gridSize: formData.gridSize,
        pieceCost: formData.pieceCost,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });
      success('퍼즐 이벤트가 생성되었습니다!');
      setShowCreateModal(false);
      setFormData(initialFormData);
      setImagePreview(null);
      await loadEvents();
    } catch (err) {
      toastError(err instanceof Error ? err.message : '이벤트 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 수정 모달 열기
  const handleOpenEdit = (event: PuzzleEvent) => {
    setEditingEvent(event);
    setEditFormData({
      title: event.title,
      description: event.description || '',
      pieceCost: event.piece_cost,
      startDate: event.start_date,
      endDate: event.end_date,
      isActive: event.is_active,
    });
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!editingEvent) return;

    if (!editFormData.title.trim()) {
      toastError('제목을 입력해주세요.');
      return;
    }
    if (!editFormData.startDate || !editFormData.endDate) {
      toastError('시작일과 종료일을 설정해주세요.');
      return;
    }
    if (editFormData.startDate > editFormData.endDate) {
      toastError('종료일은 시작일 이후여야 합니다.');
      return;
    }

    setIsEditSubmitting(true);
    try {
      const updated = await updatePuzzleEvent(editingEvent.id, {
        title: editFormData.title.trim(),
        description: editFormData.description.trim(),
        piece_cost: editFormData.pieceCost,
        start_date: editFormData.startDate,
        end_date: editFormData.endDate,
        is_active: editFormData.isActive,
      });
      setEvents(prev => prev.map(e => (e.id === editingEvent.id ? updated : e)));
      setEditingEvent(null);
      success('이벤트가 수정되었습니다.');
    } catch (err) {
      toastError(err instanceof Error ? err.message : '이벤트 수정에 실패했습니다.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleToggleActive = async (event: PuzzleEvent) => {
    try {
      await updatePuzzleEvent(event.id, { is_active: !event.is_active });
      setEvents(prev => prev.map(e => (e.id === event.id ? { ...e, is_active: !e.is_active } : e)));
      success(event.is_active ? '이벤트를 비활성화했습니다.' : '이벤트를 활성화했습니다.');
    } catch (err) {
      toastError('상태 변경에 실패했습니다.');
    }
  };

  const handleDelete = async (eventId: string) => {
    try {
      await deletePuzzleEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setShowDeleteConfirm(null);
      success('이벤트가 삭제되었습니다.');
    } catch (err) {
      toastError('이벤트 삭제에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Puzzle className="w-7 h-7 text-primary-500" />
              퍼즐 이벤트 관리
            </h1>
            <p className="text-sm text-muted-foreground mt-1">퍼즐 이벤트를 생성하고 관리합니다.</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-1" />새 이벤트
          </Button>
        </div>

        {/* 이벤트 목록 */}
        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Puzzle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">아직 퍼즐 이벤트가 없습니다.</p>
            <p className="text-sm mt-1">새 이벤트를 만들어보세요.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => {
              const status = getEventStatus(event);
              return (
                <div
                  key={event.id}
                  className="bg-card rounded-xl p-5 shadow-sm border border-border/70"
                >
                  <div className="flex gap-4">
                    {/* 이미지 미리보기 */}
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                              {event.description}
                            </p>
                          )}
                        </div>

                        {/* 상태 뱃지 */}
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : status === 'upcoming'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-muted text-muted-foreground '
                          }`}
                        >
                          {status === 'active'
                            ? '진행 중'
                            : status === 'upcoming'
                              ? '예정'
                              : '종료'}
                        </span>
                      </div>

                      {/* 메타 정보 */}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(event.start_date), 'yyyy.M.d', { locale: ko })} ~{' '}
                          {format(new Date(event.end_date), 'yyyy.M.d', { locale: ko })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Image className="w-3.5 h-3.5" />
                          {event.grid_size} ({event.total_pieces}조각)
                        </span>
                        <span className="flex items-center gap-1">
                          <Coins className="w-3.5 h-3.5" />
                          {event.piece_cost}P/조각
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {ownerCounts[event.id] || 0}명 완성
                        </span>
                      </div>

                      {/* 액션 버튼 */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleOpenEdit(event)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          수정
                        </button>
                        <button
                          onClick={() => handleToggleActive(event)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-muted transition-colors"
                          title={event.is_active ? '비활성화' : '활성화'}
                        >
                          {event.is_active ? (
                            <ToggleRight className="w-4 h-4 text-green-500" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-gray-400" />
                          )}
                          {event.is_active ? '활성' : '비활성'}
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(event.id)}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 생성 모달 */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setFormData(initialFormData);
            setImagePreview(null);
          }}
          title="새 퍼즐 이벤트"
        >
          <div className="space-y-4">
            <Input
              label="이벤트 제목"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="예: 봄맞이 퍼즐 챌린지"
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">설명 (선택)</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="이벤트 설명을 입력하세요"
                className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={2}
              />
            </div>

            {/* 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">퍼즐 이미지</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400"
              />
              {imagePreview && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border">
                  <img
                    src={imagePreview}
                    alt="미리보기"
                    className="w-full max-h-48 object-contain bg-background"
                  />
                </div>
              )}
            </div>

            {/* 그리드 크기 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                퍼즐 그리드 크기
              </label>
              <div className="flex gap-3">
                {(['4x3', '3x4'] as PuzzleGridSize[]).map(size => (
                  <button
                    key={size}
                    onClick={() => setFormData(prev => ({ ...prev, gridSize: size }))}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.gridSize === size
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'border-border text-muted-foreground hover:border-gray-300'
                    }`}
                  >
                    {size} ({size === '4x3' ? '가로형' : '세로형'} · 12조각)
                  </button>
                ))}
              </div>
            </div>

            {/* 조각 비용 */}
            <Input
              label="조각당 포인트 비용"
              type="number"
              min={1}
              max={100}
              value={formData.pieceCost}
              onChange={e =>
                setFormData(prev => ({ ...prev, pieceCost: parseInt(e.target.value) || 1 }))
              }
            />

            {/* 기간 */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="시작일"
                type="date"
                value={formData.startDate}
                onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
              <Input
                label="종료일"
                type="date"
                value={formData.endDate}
                onChange={e => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            {/* 보상 안내 (2026-10-09 통합 지갑 — 포인트는 더 쌓이지 않고 코인으로 받는다) */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">코인 획득 기준 (아카데미·다마고찌와 같은 지갑):</p>
              <ul className="space-y-0.5">
                <li>· 출석 확인: +5코인</li>
                <li>· 피드백(자기 평가): +1코인 (하루 1번, 출석한 날부터 7일 안)</li>
                <li>· 집중의 숲 25/50/90분 완주: +2코인 (다마고찌 «함께 집중»과 합쳐 하루 2번)</li>
              </ul>
              <p className="mt-1">
                퍼즐 조각은 학생의 이전 포인트를 먼저 쓰고, 모자라면 2P = 1코인으로 냅니다.
              </p>
              <p className="mt-1">
                총 완성 비용: {formData.pieceCost * 12}P (12조각 × {formData.pieceCost}P · 포인트가
                없으면 {12 * Math.ceil(formData.pieceCost / 2)}코인)
              </p>
            </div>

            {/* 버튼 */}
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData(initialFormData);
                  setImagePreview(null);
                }}
              >
                취소
              </Button>
              <Button onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? '생성 중...' : '이벤트 생성'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* 수정 모달 */}
        <Modal
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
          title="퍼즐 이벤트 수정"
        >
          {editingEvent && (
            <div className="space-y-4">
              {/* 현재 이미지 미리보기 (읽기 전용) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  퍼즐 이미지
                </label>
                <div className="rounded-lg overflow-hidden border border-border">
                  <img
                    src={editingEvent.image_url}
                    alt={editingEvent.title}
                    className="w-full max-h-40 object-contain bg-background"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {editingEvent.grid_size} · {editingEvent.total_pieces}조각 (이미지 및 그리드
                  크기는 변경 불가)
                </p>
              </div>

              <Input
                label="이벤트 제목"
                value={editFormData.title}
                onChange={e => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
              />

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  설명 (선택)
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={e =>
                    setEditFormData(prev => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="이벤트 설명을 입력하세요"
                  className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card text-foreground focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={2}
                />
              </div>

              <Input
                label="조각당 포인트 비용"
                type="number"
                min={1}
                max={100}
                value={editFormData.pieceCost}
                onChange={e =>
                  setEditFormData(prev => ({
                    ...prev,
                    pieceCost: parseInt(e.target.value) || 1,
                  }))
                }
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="시작일"
                  type="date"
                  value={editFormData.startDate}
                  onChange={e => setEditFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
                <Input
                  label="종료일"
                  type="date"
                  value={editFormData.endDate}
                  onChange={e => setEditFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              {/* 활성 상태 토글 */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground">활성 상태</p>
                  <p className="text-xs text-muted-foreground">
                    비활성화하면 학생에게 노출되지 않습니다.
                  </p>
                </div>
                <button
                  onClick={() => setEditFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className="flex-shrink-0"
                >
                  {editFormData.isActive ? (
                    <ToggleRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>

              {/* 버튼 */}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="secondary" onClick={() => setEditingEvent(null)}>
                  취소
                </Button>
                <Button onClick={handleSaveEdit} disabled={isEditSubmitting}>
                  {isEditSubmitting ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* 삭제 확인 모달 */}
        <Modal
          isOpen={!!showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(null)}
          title="이벤트 삭제"
        >
          <div className="space-y-4">
            <p className="text-muted-foreground">
              이 퍼즐 이벤트를 삭제하시겠습니까? 모든 조각과 학생 진행도가 함께 삭제됩니다. 이
              작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
                취소
              </Button>
              <Button
                variant="danger"
                onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
              >
                삭제
              </Button>
            </div>
          </div>
        </Modal>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Layout>
  );
};
