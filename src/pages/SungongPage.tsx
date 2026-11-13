import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useToast } from '@hooks/useToast';
import { Layout } from '@components/common/Layout';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { Select } from '@components/common/Select';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Modal, ConfirmModal } from '@components/common/Modal';
import { StatCard } from '@components/common/StatCard';
import { ToastContainer } from '@components/common/Toast';
import {
  getActiveSungongGrades,
  getSungongRoster,
  addSungongStudent,
  bulkAddSungongStudents,
  updateSungongStudent,
  removeSungongStudent,
  getSungongMatrixByGrade,
  buildDailySummaries,
} from '@services/sungong.service';
import type { SungongMatrix } from '@services/sungong.service';
import { getStudentList } from '@services/reservation.service';
import { downloadSungongAttendanceSheet } from '@utils/sungongHwpx';
import type {
  SungongStudentWithDetails,
  SungongZone,
  SungongPeriodMark,
} from '@/types/sungong.types';
import type { Profile } from '@/types/user.types';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  XCircle,
  BarChart3,
  Users,
  FileDown,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ClipboardCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
} from 'lucide-react';

type SungongTab = 'stats' | 'detail' | 'roster' | 'download';

const ZONE_OPTIONS: { value: SungongZone; label: string }[] = [
  { value: 'A', label: 'A반' },
  { value: 'B', label: 'B반' },
];

/** 교시 셀 마크 → 화면 표기 (HWPX: 출석 '.', 보완=약점과목, 미처리 '/') */
const MARK_DISPLAY: Record<SungongPeriodMark, { symbol: string; className: string }> = {
  present: {
    symbol: '●',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  supplement: {
    symbol: '보',
    className: 'bg-blue-500/10 font-semibold text-blue-600 dark:text-blue-400',
  },
  none: { symbol: '/', className: 'bg-muted text-muted-foreground/50' },
};

const getRateColor = (rate: number): string => {
  if (rate >= 90) return 'text-green-600 dark:text-green-400';
  if (rate >= 70) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};

const ZoneBadge = ({ zone }: { zone?: SungongZone }) => {
  if (!zone) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
        미배정
      </span>
    );
  }
  const styles =
    zone === 'A'
      ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
      : 'bg-violet-500/10 text-violet-700 dark:text-violet-300';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles}`}
    >
      {zone}반
    </span>
  );
};

export const SungongPage = () => {
  const { user } = useAuth();
  const { toasts, removeToast, success, error: showError } = useToast();

  // 학년 선택
  const [grades, setGrades] = useState<number[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [isLoadingGrades, setIsLoadingGrades] = useState(true);

  // 서브탭
  const [activeTab, setActiveTab] = useState<SungongTab>('stats');

  // 탭A: 출석 통계
  const [matrix, setMatrix] = useState<SungongMatrix | null>(null);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);

  // 탭B: 명단 관리
  const [roster, setRoster] = useState<SungongStudentWithDetails[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [allCandidates, setAllCandidates] = useState<Profile[]>([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [addZone, setAddZone] = useState<SungongZone>('A');
  const [addSubjectInput, setAddSubjectInput] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState('');
  const [editingZone, setEditingZone] = useState<SungongZone>('A');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SungongStudentWithDetails | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 탭C: 출석부 다운로드
  const [managerTeacher, setManagerTeacher] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // 순공 운영 학년 로드
  useEffect(() => {
    (async () => {
      try {
        setIsLoadingGrades(true);
        const data = await getActiveSungongGrades();
        setGrades(data);
      } catch (err) {
        showError(err instanceof Error ? err.message : '순공 운영 학년을 불러오는데 실패했습니다.');
      } finally {
        setIsLoadingGrades(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 첫 번째 학년 자동 선택
  useEffect(() => {
    if (grades.length > 0 && selectedGrade === null) {
      setSelectedGrade(grades[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grades]);

  // 명단 로드
  const loadRoster = useCallback(async () => {
    if (selectedGrade === null) return;
    try {
      setIsLoadingRoster(true);
      const data = await getSungongRoster(selectedGrade, true);
      setRoster(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : '명단을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingRoster(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrade]);

  useEffect(() => {
    loadRoster();
  }, [loadRoster]);

  // 출석 매트릭스 로드 (통계 + 다운로드 탭에서 사용)
  const loadMatrix = useCallback(async () => {
    if (selectedGrade === null) return;
    try {
      setIsLoadingMatrix(true);
      const data = await getSungongMatrixByGrade(selectedGrade);
      setMatrix(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : '출석 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingMatrix(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrade]);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  const dailySummaries = useMemo(() => (matrix ? buildDailySummaries(matrix) : []), [matrix]);

  const summaryMap = useMemo(() => {
    const map = new Map<string, Map<SungongZone, (typeof dailySummaries)[number]>>();
    dailySummaries.forEach(s => {
      if (!map.has(s.date)) map.set(s.date, new Map());
      map.get(s.date)!.set(s.zone, s);
    });
    return map;
  }, [dailySummaries]);

  const attendanceOverview = useMemo(() => {
    const totals = matrix?.rows.reduce(
      (acc, row) => ({
        present: acc.present + row.stat.presentCount,
        supplement: acc.supplement + row.stat.supplementCount,
        none: acc.none + row.stat.noneCount,
      }),
      { present: 0, supplement: 0, none: 0 }
    ) ?? { present: 0, supplement: 0, none: 0 };
    const total = totals.present + totals.supplement + totals.none;

    return {
      studentCount: matrix?.rows.length ?? roster.length,
      operationDays: matrix?.dates.length ?? 0,
      attendanceRate:
        total > 0 ? Math.round(((totals.present + totals.supplement) / total) * 100) : 0,
      noneCount: totals.none,
    };
  }, [matrix, roster.length]);

  // 학생 추가 후보 목록 필터링 (이미 등록된 학생 제외 + 검색어)
  const filteredCandidates = useMemo(() => {
    const registeredIds = new Set(roster.map(s => s.student_id));
    const pool = allCandidates.filter(c => !registeredIds.has(c.id));
    if (!candidateSearch.trim()) return pool;
    const q = candidateSearch.trim().toLowerCase();
    return pool.filter(
      c => c.name?.toLowerCase().includes(q) || c.student_number?.toLowerCase().includes(q)
    );
  }, [allCandidates, roster, candidateSearch]);

  const openAddModal = async () => {
    if (selectedGrade === null) return;
    setIsAddModalOpen(true);
    setCandidateSearch('');
    setSelectedCandidateIds(new Set());
    setAddZone('A');
    setAddSubjectInput('');
    try {
      setIsLoadingCandidates(true);
      const data = await getStudentList(selectedGrade);
      setAllCandidates(data);
    } catch (err) {
      showError(err instanceof Error ? err.message : '학생 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const toggleCandidate = (id: string) => {
    setSelectedCandidateIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCandidates = async () => {
    if (selectedGrade === null || selectedCandidateIds.size === 0) return;
    setIsSubmittingAdd(true);
    try {
      const subject = addSubjectInput.trim() || null;
      if (selectedCandidateIds.size === 1) {
        const [id] = [...selectedCandidateIds];
        await addSungongStudent(selectedGrade, id, { remedialSubject: subject, zone: addZone });
      } else {
        await bulkAddSungongStudents(
          selectedGrade,
          [...selectedCandidateIds].map(id => ({
            studentId: id,
            remedialSubject: subject,
            zone: addZone,
          }))
        );
      }
      success('학생을 추가했습니다.');
      setIsAddModalOpen(false);
      await Promise.all([loadRoster(), loadMatrix()]);
    } catch (err) {
      showError(err instanceof Error ? err.message : '학생 추가에 실패했습니다.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const startEdit = (student: SungongStudentWithDetails) => {
    setEditingId(student.id);
    setEditingSubject(student.remedial_subject ?? '');
    setEditingZone(student.zone);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingSubject('');
  };

  const saveEdit = async (id: string) => {
    setIsSavingEdit(true);
    try {
      await updateSungongStudent(id, {
        remedial_subject: editingSubject || null,
        zone: editingZone,
      });
      success('명단 정보를 수정했습니다.');
      setEditingId(null);
      await Promise.all([loadRoster(), loadMatrix()]);
    } catch (err) {
      showError(err instanceof Error ? err.message : '수정에 실패했습니다.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await removeSungongStudent(deleteTarget.id);
      success('명단에서 제거했습니다.');
      setDeleteTarget(null);
      await Promise.all([loadRoster(), loadMatrix()]);
    } catch (err) {
      showError(err instanceof Error ? err.message : '제거에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (selectedGrade === null || !managerTeacher.trim()) return;
    setIsDownloading(true);
    try {
      const data = matrix ?? (await getSungongMatrixByGrade(selectedGrade));
      if (!data) {
        showError('해당 학년의 순공 열람실이 없습니다.');
        return;
      }
      await downloadSungongAttendanceSheet(
        data,
        { managerTeacher: managerTeacher.trim() },
        `순공출석부_${selectedGrade}학년.hwpx`
      );
      success('출석부를 다운로드했습니다.');
    } catch (err) {
      showError(err instanceof Error ? err.message : '출석부 다운로드에 실패했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!user || (user.type !== 'teacher' && user.type !== 'admin')) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl text-center max-w-md">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">접근 권한 없음</h2>
            <p className="text-muted-foreground">교사 계정으로만 접근할 수 있습니다.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs: { key: SungongTab; label: string; icon: typeof BarChart3 }[] = [
    { key: 'stats', label: '출석 통계', icon: BarChart3 },
    { key: 'detail', label: '출석 현황', icon: ClipboardCheck },
    { key: 'roster', label: '명단 관리', icon: Users },
    { key: 'download', label: '출석부 다운로드', icon: FileDown },
  ];

  return (
    <Layout title="순공">
      <h1 className="sr-only">순공</h1>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="space-y-5 sm:space-y-6">
        {isLoadingGrades ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : grades.length === 0 ? (
          <div className="content-surface rounded-[2rem] p-8 text-center">
            <p className="text-muted-foreground">
              순공이 운영 중인 학년이 없습니다. 관리자에게 문의하세요.
            </p>
          </div>
        ) : (
          <>
            {/* 학년 선택 */}
            <section
              className="content-surface rounded-[2rem] p-5 sm:p-6"
              aria-labelledby="sungong-grade-title"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Sungong program
                  </p>
                  <h2
                    id="sungong-grade-title"
                    className="mt-1 text-xl font-bold tracking-[-0.025em] text-foreground"
                  >
                    운영 학년
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    학년을 선택해 출석 현황과 대상자 명단을 관리합니다.
                  </p>
                </div>
                <Select
                  aria-label="운영 학년"
                  options={grades.map(g => ({ value: g, label: `${g}학년` }))}
                  value={selectedGrade ?? ''}
                  onChange={e => setSelectedGrade(Number(e.target.value))}
                  className="w-full sm:w-48"
                  fullWidth
                />
              </div>
            </section>

            {/* 서브탭 */}
            <div
              role="tablist"
              aria-label="순공 관리 보기"
              className="content-surface grid grid-cols-2 gap-1 rounded-2xl p-1.5 sm:grid-cols-4"
            >
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold outline-none transition-[background-color,color,box-shadow,transform] focus-visible:ring-2 focus-visible:ring-ring/30 active:scale-[0.98] ${
                      isActive
                        ? 'bg-card text-foreground shadow-card'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* 탭A: 출석 통계 */}
            {activeTab === 'stats' && (
              <div className="space-y-5 sm:space-y-6" role="tabpanel">
                {isLoadingMatrix ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : !matrix || matrix.rows.length === 0 ? (
                  <div className="content-surface rounded-[2rem] p-8 text-center text-muted-foreground">
                    {matrix
                      ? '등록된 순공 대상자가 없습니다.'
                      : '해당 학년의 순공 열람실이 없습니다.'}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                      <StatCard
                        label="대상 학생"
                        value={`${attendanceOverview.studentCount}명`}
                        hint={`${selectedGrade}학년`}
                        icon={<Users className="h-4 w-4" />}
                      />
                      <StatCard
                        label="운영일"
                        value={`${attendanceOverview.operationDays}일`}
                        hint="등록된 자습일"
                        tone="info"
                        icon={<CalendarDays className="h-4 w-4" />}
                      />
                      <StatCard
                        label="출석률"
                        value={`${attendanceOverview.attendanceRate}%`}
                        hint="출석·보완 포함"
                        tone="success"
                        icon={<CheckCircle2 className="h-4 w-4" />}
                      />
                      <StatCard
                        label="미처리"
                        value={attendanceOverview.noneCount.toLocaleString('ko-KR')}
                        hint="확인이 필요한 교시"
                        tone={attendanceOverview.noneCount > 0 ? 'warning' : 'neutral'}
                        icon={<Clock3 className="h-4 w-4" />}
                      />
                    </div>

                    {/* 학생별 통계 */}
                    <section className="content-surface overflow-hidden rounded-[2rem]">
                      <div className="border-b border-border/70 px-5 py-4 sm:px-6 sm:py-5">
                        <h3 className="text-lg font-bold tracking-[-0.02em] text-foreground">
                          학생별 출석 통계
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          학생별 누적 출석과 보완·미처리 교시를 비교합니다.
                        </p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-muted/65">
                            <tr className="border-b border-border text-left">
                              <th className="px-4 py-3 font-semibold text-muted-foreground">반</th>
                              <th className="px-4 py-3 font-semibold text-muted-foreground">
                                학생
                              </th>
                              <th className="px-4 py-3 font-semibold text-muted-foreground">
                                약점과목
                              </th>
                              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                                출석
                              </th>
                              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                                보완
                              </th>
                              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                                미처리
                              </th>
                              <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                                출석률
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/70">
                            {matrix.rows.map(row => (
                              <tr
                                key={row.student.id}
                                className="transition-colors hover:bg-muted/35"
                              >
                                <td className="px-4 py-3">
                                  <ZoneBadge zone={row.stat.zone} />
                                </td>
                                <td className="px-4 py-3">
                                  <span className="block font-semibold text-foreground">
                                    {row.stat.student_name}
                                  </span>
                                  <span className="mt-0.5 block text-xs text-muted-foreground">
                                    {row.stat.student_number || '학번 미입력'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {row.stat.remedial_subject || '-'}
                                </td>
                                <td className="px-4 py-3 text-center font-medium tabular-nums text-foreground">
                                  {row.stat.presentCount}
                                </td>
                                <td className="px-4 py-3 text-center font-medium tabular-nums text-blue-600 dark:text-blue-400">
                                  {row.stat.supplementCount}
                                </td>
                                <td className="px-4 py-3 text-center font-medium tabular-nums text-muted-foreground">
                                  {row.stat.noneCount}
                                </td>
                                <td
                                  className={`px-4 py-3 text-center font-bold tabular-nums ${getRateColor(
                                    row.stat.attendanceRate
                                  )}`}
                                >
                                  {row.stat.attendanceRate}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>

                    {/* 자습일별·반별 현황 */}
                    <section className="content-surface overflow-hidden rounded-[2rem]">
                      <div className="border-b border-border/70 px-5 py-4 sm:px-6 sm:py-5">
                        <h3 className="text-lg font-bold tracking-[-0.02em] text-foreground">
                          자습일별·반별 현황
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          날짜별 A·B반의 출석 흐름을 확인합니다.
                        </p>
                      </div>
                      {dailySummaries.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          운영일 정보가 없습니다.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead className="bg-muted/65">
                              <tr className="border-b border-border">
                                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                                  날짜
                                </th>
                                {ZONE_OPTIONS.map(z => (
                                  <th
                                    key={z.value}
                                    className="px-4 py-3 text-center font-semibold text-muted-foreground"
                                  >
                                    {z.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/70">
                              {matrix.dates.map(date => {
                                const dateMap = summaryMap.get(date);
                                return (
                                  <tr key={date} className="transition-colors hover:bg-muted/35">
                                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-foreground">
                                      {format(parseISO(date), 'M/d(EEE)', { locale: ko })}
                                    </td>
                                    {ZONE_OPTIONS.map(z => {
                                      const s = dateMap?.get(z.value);
                                      if (!s || s.total === 0) {
                                        return (
                                          <td
                                            key={z.value}
                                            className="px-4 py-3 text-center text-muted-foreground/70"
                                          >
                                            -
                                          </td>
                                        );
                                      }
                                      const rate = Math.round(
                                        ((s.presentCount + s.supplementCount) / s.total) * 100
                                      );
                                      return (
                                        <td key={z.value} className="px-4 py-3 text-center">
                                          <div
                                            className={`font-bold tabular-nums ${getRateColor(rate)}`}
                                          >
                                            {rate}%
                                          </div>
                                          <div className="text-[11px] text-muted-foreground">
                                            출 {s.presentCount}·보 {s.supplementCount}·미{' '}
                                            {s.noneCount}
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  </>
                )}
              </div>
            )}

            {/* 탭: 출석 현황 (학생 × 날짜·교시 그리드) */}
            {activeTab === 'detail' && (
              <div className="space-y-4" role="tabpanel">
                {isLoadingMatrix ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : !matrix || matrix.rows.length === 0 ? (
                  <div className="content-surface rounded-[2rem] p-8 text-center text-muted-foreground">
                    {matrix
                      ? '등록된 순공 대상자가 없습니다.'
                      : '해당 학년의 순공 열람실이 없습니다.'}
                  </div>
                ) : matrix.dates.length === 0 ? (
                  <div className="content-surface rounded-[2rem] p-8 text-center text-muted-foreground">
                    운영 기간(자습일)이 설정되지 않았습니다.
                  </div>
                ) : (
                  <section className="content-surface overflow-hidden rounded-[2rem]">
                    <div className="flex flex-col gap-3 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-5">
                      <div>
                        <h3 className="text-lg font-bold tracking-[-0.02em] text-foreground">
                          학생별 출석 현황
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          날짜와 교시별 처리 상태를 한 화면에서 확인합니다.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] font-medium text-muted-foreground">
                        <span className="font-semibold text-foreground">상태</span>
                        <span className="inline-flex items-center gap-1">
                          <span className="text-emerald-600 dark:text-emerald-400">●</span>
                          출석
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="font-bold text-blue-600 dark:text-blue-400">보</span>
                          보완
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="text-muted-foreground/70">/</span>
                          미처리
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="text-xs">
                        <thead className="bg-muted">
                          {/* 날짜 행 */}
                          <tr className="border-b border-border">
                            <th
                              rowSpan={2}
                              className="sticky left-0 z-30 w-14 min-w-14 border-r border-border bg-muted px-2 py-2 font-semibold text-muted-foreground"
                            >
                              반
                            </th>
                            <th
                              rowSpan={2}
                              className="sticky left-14 z-30 w-[120px] min-w-[120px] border-r border-border bg-muted px-3 py-2 text-left font-semibold text-muted-foreground"
                            >
                              학생
                            </th>
                            {matrix.dates.map(date => (
                              <th
                                key={date}
                                colSpan={matrix.periods.length}
                                className="whitespace-nowrap border-l border-border px-2 py-2 text-center font-semibold text-muted-foreground"
                              >
                                {format(parseISO(date), 'M/d(EEE)', { locale: ko })}
                              </th>
                            ))}
                          </tr>
                          {/* 교시 행 */}
                          <tr className="border-b border-border">
                            {matrix.dates.map(date =>
                              matrix.periods.map((p, pi) => (
                                <th
                                  key={`${date}-${p.id}`}
                                  title={p.name}
                                  className={`w-7 min-w-7 px-1 py-1.5 text-center font-medium text-muted-foreground ${
                                    pi === 0 ? 'border-l border-border' : ''
                                  }`}
                                >
                                  {pi + 1}
                                </th>
                              ))
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/70">
                          {matrix.rows.map(row => (
                            <tr
                              key={row.student.id}
                              className="group/row transition-colors hover:bg-muted/35"
                            >
                              <td className="sticky left-0 z-10 border-r border-border bg-card px-2 py-2 group-hover/row:bg-muted">
                                <ZoneBadge zone={row.student.zone} />
                              </td>
                              <td className="sticky left-14 z-10 w-[120px] min-w-[120px] border-r border-border bg-card px-3 py-2 group-hover/row:bg-muted">
                                <span className="block whitespace-nowrap font-semibold text-foreground">
                                  {row.student.student_name}
                                </span>
                                <span className="mt-0.5 block whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                                  {row.student.student_number || '학번 미입력'}
                                </span>
                              </td>
                              {matrix.dates.map(date =>
                                matrix.periods.map((p, pi) => {
                                  const mark = row.marks[date]?.[p.id] ?? 'none';
                                  const disp = MARK_DISPLAY[mark];
                                  return (
                                    <td
                                      key={`${date}-${p.id}`}
                                      title={
                                        mark === 'supplement'
                                          ? row.student.remedial_subject || '보완'
                                          : undefined
                                      }
                                      className={`px-1 py-2 text-center ${
                                        pi === 0 ? 'border-l border-border' : ''
                                      }`}
                                    >
                                      <span
                                        className={`mx-auto flex h-6 w-6 items-center justify-center rounded-lg ${disp.className}`}
                                      >
                                        {disp.symbol}
                                      </span>
                                    </td>
                                  );
                                })
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* 탭B: 명단 관리 */}
            {activeTab === 'roster' && (
              <section className="content-surface overflow-hidden rounded-[2rem]" role="tabpanel">
                <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
                  <div>
                    <h3 className="text-lg font-bold tracking-[-0.02em] text-foreground">
                      순공 대상자 명단
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedGrade}학년 대상자 {roster.length}명의 반과 약점과목을 관리합니다.
                    </p>
                  </div>
                  <Button size="sm" onClick={openAddModal}>
                    <Plus className="h-4 w-4" />
                    학생 추가
                  </Button>
                </div>

                {isLoadingRoster ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : roster.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    등록된 대상자가 없습니다. 학생을 추가해주세요.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-muted/65">
                        <tr className="border-b border-border text-left">
                          <th className="px-4 py-3 font-semibold text-muted-foreground">반</th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground">학생</th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground">
                            약점과목
                          </th>
                          <th className="px-4 py-3 font-semibold text-muted-foreground">
                            신청 좌석
                          </th>
                          <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                            수정/삭제
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/70">
                        {roster.map(student => {
                          const isEditing = editingId === student.id;
                          return (
                            <tr key={student.id} className="transition-colors hover:bg-muted/35">
                              <td className="px-4 py-3">
                                {isEditing ? (
                                  <Select
                                    options={ZONE_OPTIONS}
                                    value={editingZone}
                                    onChange={e => setEditingZone(e.target.value as SungongZone)}
                                    className="w-24"
                                  />
                                ) : (
                                  <ZoneBadge zone={student.zone} />
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="block font-semibold text-foreground">
                                  {student.student_name}
                                </span>
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                  {student.student_number || '학번 미입력'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {isEditing ? (
                                  <Input
                                    value={editingSubject}
                                    onChange={e => setEditingSubject(e.target.value)}
                                    className="w-32"
                                    autoFocus
                                  />
                                ) : (
                                  <span className="text-foreground">
                                    {student.remedial_subject || (
                                      <span className="text-muted-foreground">미입력</span>
                                    )}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {student.seat_number ? (
                                  <span className="font-medium text-foreground">
                                    {student.seat_number}번
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">미신청</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => saveEdit(student.id)}
                                      disabled={isSavingEdit}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-600 transition-colors hover:bg-emerald-500/10 hover:text-emerald-700 disabled:opacity-50"
                                      aria-label="저장"
                                    >
                                      <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      disabled={isSavingEdit}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                                      aria-label="취소"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => startEdit(student)}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                      aria-label="수정"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteTarget(student)}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                                      aria-label="삭제"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* 탭C: 출석부 다운로드 */}
            {activeTab === 'download' && (
              <section
                className="content-surface max-w-2xl rounded-[2rem] p-5 sm:p-7"
                role="tabpanel"
              >
                <div className="mb-5">
                  <h3 className="text-lg font-bold tracking-[-0.02em] text-foreground">
                    출석부 다운로드
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    선택한 학년의 순공 명단과 운영 일정을 HWPX 출석부로 생성합니다.
                  </p>
                </div>
                <Input
                  label="순공관리교사"
                  value={managerTeacher}
                  onChange={e => setManagerTeacher(e.target.value)}
                  placeholder="관리교사 이름을 입력하세요"
                  fullWidth
                />

                <p className="mt-3 rounded-2xl bg-muted/60 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                  A반→B반 순서, 7월 27일~8월 7일 평일, 페이지당 2일씩, 1~8교시 형식의 출석부가
                  생성됩니다.
                </p>

                {!managerTeacher.trim() && (
                  <p className="mt-3 text-xs font-medium text-amber-600 dark:text-amber-400">
                    관리교사 이름을 입력해야 다운로드할 수 있습니다.
                  </p>
                )}

                <Button
                  onClick={handleDownload}
                  isLoading={isDownloading}
                  disabled={!managerTeacher.trim() || isDownloading}
                  className="mt-5"
                >
                  <FileDown className="h-4 w-4" />
                  출석부 다운로드 (HWPX)
                </Button>
              </section>
            )}
          </>
        )}
      </div>

      {/* 학생 추가 모달 */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="학생 추가"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleAddCandidates}
              isLoading={isSubmittingAdd}
              disabled={selectedCandidateIds.size === 0 || isSubmittingAdd}
            >
              {selectedCandidateIds.size > 1
                ? `일괄 추가 (${selectedCandidateIds.size}명)`
                : '추가'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            placeholder="이름 또는 학번 검색..."
            value={candidateSearch}
            onChange={e => setCandidateSearch(e.target.value)}
            fullWidth
          />

          {isLoadingCandidates ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto border border-border rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
              {filteredCandidates.length === 0 ? (
                <p className="p-4 text-sm text-center text-muted-foreground">
                  검색 결과가 없습니다.
                </p>
              ) : (
                filteredCandidates.map(candidate => (
                  <label
                    key={candidate.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/60"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCandidateIds.has(candidate.id)}
                      onChange={() => toggleCandidate(candidate.id)}
                      className="rounded border-input text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {candidate.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {candidate.grade ? `${candidate.grade}학년 ${candidate.class ?? ''}반` : ''}
                        {candidate.student_number ? ` · ${candidate.student_number}` : ''}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="반"
              options={ZONE_OPTIONS}
              value={addZone}
              onChange={e => setAddZone(e.target.value as SungongZone)}
              fullWidth
            />
            <Input
              label="약점(보완) 과목"
              placeholder="예: 수학"
              value={addSubjectInput}
              onChange={e => setAddSubjectInput(e.target.value)}
              fullWidth
            />
          </div>

          {selectedCandidateIds.size > 1 && (
            <p className="text-xs text-muted-foreground">
              선택한 모든 학생에게 동일하게 적용되며, 추가 후 개별로 수정할 수 있습니다.
            </p>
          )}
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="명단에서 제거"
        message={`${deleteTarget?.student_name ?? ''} 학생을 순공 명단에서 제거하시겠습니까?`}
        confirmText="제거"
        variant="danger"
        isLoading={isDeleting}
      />
    </Layout>
  );
};
