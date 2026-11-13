import { useState, useEffect } from 'react';
import type { SeatLayout } from '../../types/reservation.types';

interface SeatLayoutEditorProps {
  initialLayout?: SeatLayout;
  onChange: (layout: SeatLayout) => void;
  /** 순공 열람실일 때 좌석별 A반/B반 지정 도구 노출 */
  showZones?: boolean;
}

// 0: Empty (Aisle), 1: Seat (Available), 2: Unavailable (Blocked)
type CellState = 0 | 1 | 2;
// 배치 도구: 좌석 상태 또는 반 지정(A/B/해제)
type Tool = CellState | 'A' | 'B' | 'clearZone';
type ZoneMap = Record<string, 'A' | 'B'>;

const seatNumOf = (r: number, c: number) => `${String.fromCharCode(65 + r)}${c + 1}`;

export const SeatLayoutEditor = ({ initialLayout, onChange, showZones }: SeatLayoutEditorProps) => {
  const [rows, setRows] = useState(initialLayout?.totalRows || 5);
  const [cols, setCols] = useState(initialLayout?.totalColumns || 5);

  // Grid state
  const [grid, setGrid] = useState<CellState[][]>([]);
  // 좌석별 반 (A/B) - 사용 가능 좌석에만 유효
  const [zones, setZones] = useState<ZoneMap>(initialLayout?.seatZones || {});

  // Paint tool state
  const [selectedTool, setSelectedTool] = useState<Tool>(1); // Default to Seat

  // Initialize grid from layout or defaults
  useEffect(() => {
    const newGrid: CellState[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(1)); // Default all to seats

    if (initialLayout) {
      // Mark all as empty first if sections exist (to rebuild strictly from sections)
      if (initialLayout.sections && initialLayout.sections.length > 0) {
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            newGrid[r][c] = 0;
          }
        }

        // Fill from sections
        initialLayout.sections.forEach(section => {
          for (let r = section.startRow; r < section.startRow + section.rows; r++) {
            for (let c = section.startCol; c < section.startCol + section.columns; c++) {
              if (r < rows && c < cols) {
                newGrid[r][c] = 1; // Default to available seat
              }
            }
          }
        });
      }

      // Apply empty seats (holes within sections) - make them 0
      if (initialLayout.emptySeats) {
        initialLayout.emptySeats.forEach(seatNum => {
          const match = seatNum.match(/^([A-Z])(\d+)$/);
          if (match) {
            const r = match[1].charCodeAt(0) - 65;
            const c = parseInt(match[2], 10) - 1;
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
              newGrid[r][c] = 0;
            }
          }
        });
      }

      // Apply unavailable seats - make them 2
      if (initialLayout.unavailableSeats) {
        initialLayout.unavailableSeats.forEach(seatNum => {
          const match = seatNum.match(/^([A-Z])(\d+)$/);
          if (match) {
            const r = match[1].charCodeAt(0) - 65;
            const c = parseInt(match[2], 10) - 1;
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
              newGrid[r][c] = 2;
            }
          }
        });
      }
    }

    setGrid(newGrid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle resize
  const handleResize = (newRows: number, newCols: number) => {
    const newGrid = Array(newRows)
      .fill(null)
      .map((_, r) =>
        Array(newCols)
          .fill(null)
          .map((_, c) => {
            // Preserve existing value if within bounds
            if (r < grid.length && c < grid[0]?.length) {
              return grid[r][c];
            }
            // New cells default to 0 (aisle)
            return 0;
          })
      );

    setGrid(newGrid);
    // 범위를 벗어난 좌석의 반 지정 제거
    const prunedZones = pruneZones(zones, newGrid, newRows, newCols);
    setZones(prunedZones);
    updateLayout(newGrid, prunedZones, newRows, newCols);
  };

  const handleRowsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 1;
    const newRows = Math.min(Math.max(val, 1), 20); // Clamp between 1 and 20
    setRows(newRows);
    handleResize(newRows, cols);
  };

  const handleColsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 1;
    const newCols = Math.min(Math.max(val, 1), 20); // Clamp between 1 and 20
    setCols(newCols);
    handleResize(rows, newCols);
  };

  // Drag state
  const [isDragging, setIsDragging] = useState(false);

  // 도구를 셀에 적용 (좌석 상태 or 반 지정). 변경된 grid/zones 반환
  const applyTool = (
    r: number,
    c: number,
    currentGrid: CellState[][],
    currentZones: ZoneMap
  ): { grid: CellState[][]; zones: ZoneMap } => {
    const seatNum = seatNumOf(r, c);

    // 반 지정 도구
    if (selectedTool === 'A' || selectedTool === 'B') {
      // 사용 가능 좌석에만 반 지정 가능
      if (currentGrid[r][c] !== 1) return { grid: currentGrid, zones: currentZones };
      if (currentZones[seatNum] === selectedTool) return { grid: currentGrid, zones: currentZones };
      return { grid: currentGrid, zones: { ...currentZones, [seatNum]: selectedTool } };
    }
    if (selectedTool === 'clearZone') {
      if (!(seatNum in currentZones)) return { grid: currentGrid, zones: currentZones };
      const next = { ...currentZones };
      delete next[seatNum];
      return { grid: currentGrid, zones: next };
    }

    // 좌석 상태 도구 (0/1/2)
    if (currentGrid[r][c] === selectedTool) return { grid: currentGrid, zones: currentZones };
    const newGrid = [...currentGrid];
    newGrid[r] = [...newGrid[r]];
    newGrid[r][c] = selectedTool;
    // 사용 가능 좌석이 아니게 되면 반 지정 제거
    let newZones = currentZones;
    if (selectedTool !== 1 && seatNum in currentZones) {
      newZones = { ...currentZones };
      delete newZones[seatNum];
    }
    return { grid: newGrid, zones: newZones };
  };

  // Handle cell mouse down (start drag)
  const handleMouseDown = (r: number, c: number) => {
    const { grid: g, zones: z } = applyTool(r, c, grid, zones);
    setGrid(g);
    setZones(z);
    setIsDragging(true);
  };

  // Handle cell mouse enter (continue drag)
  const handleMouseEnter = (r: number, c: number) => {
    if (isDragging) {
      const { grid: g, zones: z } = applyTool(r, c, grid, zones);
      setGrid(g);
      setZones(z);
    }
  };

  // Handle mouse up (end drag and save)
  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      updateLayout(grid, zones, rows, cols);
    }
  };

  // Add global mouse up listener to catch drag end outside grid
  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  });

  // 좌석이 아니거나 범위를 벗어난 반 지정 제거
  const pruneZones = (z: ZoneMap, g: CellState[][], nRows: number, nCols: number): ZoneMap => {
    const next: ZoneMap = {};
    Object.entries(z).forEach(([seatNum, zone]) => {
      const match = seatNum.match(/^([A-Z])(\d+)$/);
      if (!match) return;
      const r = match[1].charCodeAt(0) - 65;
      const c = parseInt(match[2], 10) - 1;
      if (r >= 0 && r < nRows && c >= 0 && c < nCols && g[r]?.[c] === 1) {
        next[seatNum] = zone;
      }
    });
    return next;
  };

  // Convert grid to SeatLayout JSON
  const updateLayout = (
    currentGrid: CellState[][],
    currentZones: ZoneMap,
    currentRows: number,
    currentCols: number
  ) => {
    const emptySeats: string[] = [];
    const unavailableSeats: string[] = [];

    // Generate seat numbers
    for (let r = 0; r < currentRows; r++) {
      for (let c = 0; c < currentCols; c++) {
        const seatNum = seatNumOf(r, c);

        if (currentGrid[r][c] === 0) {
          emptySeats.push(seatNum);
        } else if (currentGrid[r][c] === 2) {
          unavailableSeats.push(seatNum);
        }
      }
    }

    // 사용 가능 좌석의 반 지정만 유지
    const seatZones = pruneZones(currentZones, currentGrid, currentRows, currentCols);

    const layout: SeatLayout = {
      totalRows: currentRows,
      totalColumns: currentCols,
      sections: [
        {
          startRow: 0,
          startCol: 0,
          rows: currentRows,
          columns: currentCols,
        },
      ],
      emptySeats: emptySeats,
      unavailableSeats: unavailableSeats,
      seatZones: seatZones,
    };

    onChange(layout);
  };

  // 반 자동 지정 헬퍼: 사용 가능 좌석 전체를 규칙에 따라 A/B로 채움
  const autoAssignZones = (mode: 'left-right' | 'checker' | 'clear') => {
    const next: ZoneMap = {};
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r]?.[c] !== 1) continue;
        const seatNum = seatNumOf(r, c);
        if (mode === 'clear') continue;
        if (mode === 'left-right') {
          next[seatNum] = c < Math.floor(cols / 2) ? 'A' : 'B';
        } else {
          next[seatNum] = (r + c) % 2 === 0 ? 'A' : 'B';
        }
      }
    }
    setZones(next);
    updateLayout(grid, next, rows, cols);
  };

  const zoneCounts = Object.values(zones).reduce(
    (acc, z) => {
      acc[z] += 1;
      return acc;
    },
    { A: 0, B: 0 } as Record<'A' | 'B', number>
  );

  const toolBtnClass = (active: boolean, activeCls: string) =>
    `px-3 py-2 text-sm font-medium rounded-md border transition-colors flex items-center gap-2 ${
      active ? activeCls : 'bg-card border-input text-foreground hover:bg-muted '
    }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-end gap-6 border-b border-border pb-6">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">행 (Rows)</label>
            <input
              type="number"
              min="1"
              max="20"
              value={rows}
              onChange={handleRowsChange}
              className="block w-24 rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">열 (Columns)</label>
            <input
              type="number"
              min="1"
              max="20"
              value={cols}
              onChange={handleColsChange}
              className="block w-24 rounded-md border-input shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-foreground mb-2">배치 도구</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedTool(1)}
              className={toolBtnClass(
                selectedTool === 1,
                'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/20 dark:border-primary-500 dark:text-primary-300'
              )}
            >
              <div className="w-4 h-4 rounded bg-white border border-gray-300"></div>
              사용 가능 좌석
            </button>
            <button
              type="button"
              onClick={() => setSelectedTool(2)}
              className={toolBtnClass(
                selectedTool === 2,
                'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-300'
              )}
            >
              <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300 opacity-50"></div>
              사용 불가 (X)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTool(0)}
              className={toolBtnClass(
                selectedTool === 0,
                'bg-muted border-gray-500 text-foreground dark:border-gray-500 '
              )}
            >
              <div className="w-4 h-4 rounded border border-dashed border-gray-300"></div>
              복도 (빈 공간)
            </button>

            {showZones && (
              <>
                <div className="w-px self-stretch bg-muted mx-1" />
                <button
                  type="button"
                  onClick={() => setSelectedTool('A')}
                  className={toolBtnClass(
                    selectedTool === 'A',
                    'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300'
                  )}
                >
                  <div className="w-4 h-4 rounded bg-blue-500"></div>A반
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTool('B')}
                  className={toolBtnClass(
                    selectedTool === 'B',
                    'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-500 dark:text-emerald-300'
                  )}
                >
                  <div className="w-4 h-4 rounded bg-emerald-500"></div>B반
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTool('clearZone')}
                  className={toolBtnClass(
                    selectedTool === 'clearZone',
                    'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/20 dark:border-amber-500 dark:text-amber-300'
                  )}
                >
                  <div className="w-4 h-4 rounded border border-dashed border-amber-400"></div>반
                  해제
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showZones && (
        <div className="flex flex-wrap items-center gap-3 -mt-2">
          <span className="text-sm text-gray-500">
            반 배정: <span className="text-blue-600 font-medium">A {zoneCounts.A}석</span> ·{' '}
            <span className="text-emerald-600 font-medium">B {zoneCounts.B}석</span>
          </span>
          <span className="text-muted-foreground/70">|</span>
          <span className="text-xs text-gray-400">빠른 배정:</span>
          <button
            type="button"
            onClick={() => autoAssignZones('left-right')}
            className="px-2 py-1 text-xs rounded border border-input text-muted-foreground hover:bg-muted/60"
          >
            좌(A)/우(B)
          </button>
          <button
            type="button"
            onClick={() => autoAssignZones('checker')}
            className="px-2 py-1 text-xs rounded border border-input text-muted-foreground hover:bg-muted/60"
          >
            체커보드
          </button>
          <button
            type="button"
            onClick={() => autoAssignZones('clear')}
            className="px-2 py-1 text-xs rounded border border-input text-muted-foreground hover:bg-muted/60"
          >
            전체 해제
          </button>
        </div>
      )}

      <div className="pb-1 text-sm text-gray-500">
        * 도구를 선택한 후 그리드를 드래그하여 배치하세요.
        {showZones && ' A반/B반은 사용 가능 좌석에만 지정됩니다.'}
      </div>

      <div className="overflow-x-auto p-4 bg-background rounded-lg border border-border select-none">
        <div
          className="grid gap-1 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(2.5rem, 1fr))`,
            width: 'fit-content',
          }}
        >
          {grid.map((row, r) =>
            row.map((cellState, c) => {
              const seatNum = seatNumOf(r, c);
              const zone = cellState === 1 ? zones[seatNum] : undefined;
              const zoneCls =
                zone === 'A'
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500'
                  : zone === 'B'
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-400 dark:border-emerald-500'
                    : '';
              return (
                <div
                  key={`${r}-${c}`}
                  onMouseDown={() => handleMouseDown(r, c)}
                  onMouseEnter={() => handleMouseEnter(r, c)}
                  className={`
                    w-10 h-10 rounded-t-lg rounded-b-md border transition-all duration-200 flex items-center justify-center text-xs font-medium cursor-pointer relative
                    ${
                      cellState === 1
                        ? zoneCls ||
                          'bg-card border-input text-foreground hover:border-primary-500 shadow-sm'
                        : cellState === 2
                          ? 'bg-muted/50 border-input text-muted-foreground opacity-70' // Unavailable
                          : 'bg-transparent border-dashed border-input opacity-50' // Empty
                    }
                  `}
                >
                  {cellState !== 0 && (
                    <>
                      <span className="z-10">
                        {String.fromCharCode(65 + r)}
                        {c + 1}
                      </span>
                      {/* Chair back effect */}
                      <div className="absolute inset-x-1 top-1 h-1/2 bg-white/10 rounded-t-lg pointer-events-none"></div>
                    </>
                  )}
                  {zone && (
                    <span
                      className={`absolute top-0.5 right-0.5 z-20 text-[10px] font-bold leading-none px-1 rounded ${
                        zone === 'A' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {zone}
                    </span>
                  )}
                  {cellState === 2 && (
                    <div className="absolute inset-0 flex items-center justify-center text-red-500/50 font-bold text-lg select-none">
                      <svg
                        className="w-full h-full p-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
