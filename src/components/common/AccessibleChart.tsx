import { ReactNode, useState } from 'react';
import { Table2, BarChart3 } from 'lucide-react';

interface ColumnConfig {
  key: string;
  label: string;
  format?: (value: any) => string;
}

interface AccessibleChartProps {
  children: ReactNode;
  data: Record<string, any>[];
  columns: ColumnConfig[];
  title: string;
  description?: string;
}

export const AccessibleChart = ({
  children,
  data,
  columns,
  title,
  description,
}: AccessibleChartProps) => {
  const [showTable, setShowTable] = useState(false);

  return (
    <div role="figure" aria-label={title}>
      <div className="flex items-center justify-between mb-2">
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
          aria-label={showTable ? '차트 보기' : '데이터 테이블 보기'}
        >
          {showTable ? (
            <>
              <BarChart3 className="w-3.5 h-3.5" />
              차트 보기
            </>
          ) : (
            <>
              <Table2 className="w-3.5 h-3.5" />표 보기
            </>
          )}
        </button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    scope="col"
                    className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/40">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-2 text-gray-900 dark:text-gray-200">
                      {col.format ? col.format(row[col.key]) : String(row[col.key] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div aria-hidden="true">{children}</div>
      )}

      {/* Screen reader summary */}
      <div className="sr-only" role="status">
        {title}: {data.length}개 데이터 항목.
        {showTable
          ? '데이터 테이블을 표시하고 있습니다.'
          : '차트를 표시하고 있습니다. 표 보기 버튼을 눌러 데이터 테이블로 전환할 수 있습니다.'}
      </div>
    </div>
  );
};
