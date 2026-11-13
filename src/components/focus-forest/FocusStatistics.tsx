// FocusStatistics - Focus time statistics, charts, and session history

import { useState, useEffect, useCallback } from 'react';
import type { FocusForestData } from '@/types/focusForest.types';
import { useAuth } from '@hooks/useAuth';
import { getSessions, updateSessionMemo } from '@/services/focusForest.service';

interface FocusStatisticsProps {
  data: FocusForestData;
  onClose: () => void;
  userId?: string;
  readOnly?: boolean;
  title?: string;
}

interface SessionRow {
  id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  trees_planted: number;
  memo: string | null;
}

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  return `${m}분`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${h}:${m}`;
}

function getDayLabel(dateStr: string): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[new Date(dateStr).getDay()];
}

function getLast7Days(): string[] {
  const result: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push(d.toISOString().slice(0, 10));
  }
  return result;
}

const PAGE_SIZE = 5;

export const FocusStatistics = ({
  data,
  onClose,
  userId,
  readOnly = false,
  title = '집중 기록',
}: FocusStatisticsProps) => {
  const { user } = useAuth();
  const targetUserId = userId ?? user?.profile_id;
  const totalH = Math.floor(data.totalFocusSeconds / 3600);
  const totalM = Math.floor((data.totalFocusSeconds % 3600) / 60);
  const totalTrees = data.forests.reduce((sum, f) => sum + f.totalTrees, 0);
  const completedForests = data.forests.filter(f => f.completedAt).length;

  // Session list state
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMemo, setEditMemo] = useState('');

  const loadSessions = useCallback(
    async (p: number) => {
      if (!targetUserId) return;
      const result = await getSessions(targetUserId, p, PAGE_SIZE);
      setSessions(result.sessions as SessionRow[]);
      setTotalSessions(result.total);
    },
    [targetUserId]
  );

  useEffect(() => {
    loadSessions(page);
  }, [page, loadSessions]);

  const totalPages = Math.ceil(totalSessions / PAGE_SIZE);

  const handleMemoClick = (session: SessionRow) => {
    if (readOnly) return;
    setEditingId(session.id);
    setEditMemo(session.memo ?? '');
  };

  const handleMemoSave = async (sessionId: string) => {
    if (readOnly) return;
    await updateSessionMemo(sessionId, editMemo);
    setSessions(prev => prev.map(s => (s.id === sessionId ? { ...s, memo: editMemo } : s)));
    setEditingId(null);
  };

  const handleMemoKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleMemoSave(sessionId);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  // Build 7-day chart data
  const last7 = getLast7Days();
  const recordMap = new Map(data.dailyRecords.map(r => [r.date, r.focusSeconds]));
  const chartData = last7.map(date => ({
    date,
    label: getDayLabel(date),
    seconds: recordMap.get(date) ?? 0,
  }));

  const maxSeconds = Math.max(...chartData.map(d => d.seconds), 1);

  const svgW = 480;
  const svgH = 160;
  const padLeft = 40;
  const padRight = 16;
  const padTop = 24;
  const padBottom = 28;
  const chartW = svgW - padLeft - padRight;
  const chartH = svgH - padTop - padBottom;
  const barW = Math.floor((chartW / 7) * 0.55);
  const gap = chartW / 7;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl mx-4 bg-card rounded-3xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            {readOnly && <p className="text-xs text-muted-foreground">읽기 전용</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mb-1">
                총 집중 시간
              </p>
              <p className="text-xl font-bold text-foreground">
                {totalH}시간 {totalM}분
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 p-4">
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium mb-1">
                최장 연속 집중
              </p>
              <p className="text-xl font-bold text-foreground">
                {data.longestSessionSeconds > 0 ? formatSeconds(data.longestSessionSeconds) : '-'}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-4">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-1">
                총 키운 나무
              </p>
              <p className="text-xl font-bold text-foreground">{totalTrees}그루</p>
            </div>
            <div className="rounded-xl bg-purple-50 dark:bg-purple-950/30 p-4">
              <p className="text-xs text-purple-700 dark:text-purple-400 font-medium mb-1">
                완성한 숲
              </p>
              <p className="text-xl font-bold text-foreground">{completedForests}개</p>
            </div>
          </div>

          {/* Weekly bar chart */}
          <div>
            <p className="text-sm font-semibold text-foreground/80 mb-3">최근 7일 집중 시간</p>
            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgW} ${svgH}`}
                className="w-full"
                style={{ minWidth: 280 }}
                aria-label="주간 집중 시간 차트"
              >
                {[0, 0.5, 1].map(frac => {
                  const y = padTop + chartH - frac * chartH;
                  const hrs = ((maxSeconds * frac) / 3600).toFixed(1);
                  return (
                    <g key={frac}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={svgW - padRight}
                        y2={y}
                        stroke="currentColor"
                        strokeOpacity={0.1}
                        strokeWidth={1}
                      />
                      <text
                        x={padLeft - 4}
                        y={y + 4}
                        textAnchor="end"
                        fontSize={10}
                        fill="currentColor"
                        opacity={0.5}
                      >
                        {hrs}h
                      </text>
                    </g>
                  );
                })}
                {chartData.map((d, i) => {
                  const barH = (d.seconds / maxSeconds) * chartH;
                  const x = padLeft + gap * i + gap / 2 - barW / 2;
                  const y = padTop + chartH - barH;
                  const hoursLabel =
                    d.seconds > 0
                      ? d.seconds >= 3600
                        ? `${(d.seconds / 3600).toFixed(1)}h`
                        : `${Math.floor(d.seconds / 60)}m`
                      : '';
                  return (
                    <g key={d.date}>
                      {d.seconds > 0 && (
                        <rect
                          x={x}
                          y={y}
                          width={barW}
                          height={barH}
                          rx={3}
                          fill="#10b981"
                          opacity={0.85}
                        />
                      )}
                      {d.seconds === 0 && (
                        <rect
                          x={x}
                          y={padTop + chartH - 2}
                          width={barW}
                          height={2}
                          rx={1}
                          fill="currentColor"
                          opacity={0.15}
                        />
                      )}
                      {hoursLabel && (
                        <text
                          x={x + barW / 2}
                          y={y - 4}
                          textAnchor="middle"
                          fontSize={9}
                          fill="#10b981"
                          fontWeight="600"
                        >
                          {hoursLabel}
                        </text>
                      )}
                      <text
                        x={x + barW / 2}
                        y={padTop + chartH + 16}
                        textAnchor="middle"
                        fontSize={11}
                        fill="currentColor"
                        opacity={0.6}
                      >
                        {d.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Session history table */}
          <div>
            <p className="text-sm font-semibold text-foreground/80 mb-3">세션 기록</p>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground/70 text-center py-4">
                아직 기록이 없습니다
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 px-2 font-medium">시작</th>
                      <th className="text-left py-2 px-2 font-medium">종료</th>
                      <th className="text-right py-2 px-2 font-medium">시간</th>
                      <th className="text-right py-2 px-2 font-medium">나무</th>
                      <th className="text-left py-2 px-2 font-medium">메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr
                        key={s.id}
                        className="border-b border-border hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-2 px-2 text-foreground/80 whitespace-nowrap">
                          {formatDateTime(s.started_at)}
                        </td>
                        <td className="py-2 px-2 text-foreground/80 whitespace-nowrap">
                          {formatDateTime(s.ended_at)}
                        </td>
                        <td className="py-2 px-2 text-right text-foreground/80 whitespace-nowrap">
                          {formatSeconds(s.duration_seconds)}
                        </td>
                        <td className="py-2 px-2 text-right text-foreground/80">
                          {s.trees_planted}
                        </td>
                        <td className="py-2 px-2 min-w-[120px]">
                          {readOnly ? (
                            <span className="block w-full px-2 py-1 text-foreground/70">
                              {s.memo || '—'}
                            </span>
                          ) : editingId === s.id ? (
                            <input
                              type="text"
                              value={editMemo}
                              onChange={e => setEditMemo(e.target.value)}
                              onBlur={() => handleMemoSave(s.id)}
                              onKeyDown={e => handleMemoKeyDown(e, s.id)}
                              autoFocus
                              className="w-full text-sm px-2 py-1 rounded border border-emerald-300 dark:border-emerald-700
                                bg-card text-foreground
                                focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              placeholder="메모 입력..."
                            />
                          ) : (
                            <span
                              onClick={() => handleMemoClick(s)}
                              className={`block w-full px-2 py-1 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                s.memo ? 'text-foreground/80' : 'text-gray-300 dark:text-gray-600'
                              }`}
                            >
                              {s.memo || '클릭하여 메모 추가'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-xs rounded-lg border border-border
                    disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                    text-muted-foreground"
                >
                  이전
                </button>
                <span className="text-xs text-muted-foreground">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-xs rounded-lg border border-border
                    disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors
                    text-muted-foreground"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
