import { eachDayOfInterval, format } from 'date-fns';
import type { PeriodStatus, StudentDailyAttendance } from '@services/statistics.service';

/**
 * 일별 출석 현황 내보내기(CSV/Excel) 공용 집계 로직.
 *
 * 이전에는 CSV와 Excel이 각자 같은 계산을 복사해두고 종일(period 0) 처리만 달라서
 * (CSV는 filter, Excel은 find) 중복 신청이 Excel에서만 누락됐습니다.
 * 여기서 하나로 합쳐 두 내보내기가 항상 동일한 값을 내도록 합니다.
 */

export interface AttendanceSheet {
  sheetName: string;
  data: (string | number)[][];
}

/** 출석으로 집계할 상태 (인정출석 포함) */
const isPresent = (status: PeriodStatus['status']): boolean =>
  status === 'attended' || status === 'excused';

/** 기간 중 최소 한 명이라도 신청이 있는 날짜만 추립니다. */
export const getDaysWithData = (
  students: StudentDailyAttendance[],
  startDate: Date,
  endDate: Date
): Date[] => {
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  return allDays.filter(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return students.some(student => (student.attendance[dateStr]?.length ?? 0) > 0);
  });
};

/**
 * 데이터에서 실제로 사용된 최대 교시를 찾습니다.
 * period 0(종일)은 최대값 계산에서 제외하며, 교시 데이터가 없으면 1을 반환합니다.
 */
const detectMaxPeriod = (
  students: StudentDailyAttendance[],
  inScope: (period: PeriodStatus) => boolean
): number => {
  let maxPeriod = 1;
  for (const student of students) {
    for (const periods of Object.values(student.attendance)) {
      for (const period of periods) {
        if (inScope(period) && period.period > maxPeriod) maxPeriod = period.period;
      }
    }
  }
  return maxPeriod;
};

/**
 * 출석 매트릭스를 만듭니다: [헤더, 체크교사 행, ...학생 행]
 *
 * @param roomId 지정하면 해당 열람실 신청만 포함합니다. (Excel 시트 분리용)
 */
export const buildAttendanceMatrix = (
  students: StudentDailyAttendance[],
  daysWithData: Date[],
  roomId?: string | null
): (string | number)[][] => {
  const inScope = (period: PeriodStatus) => !roomId || period.roomId === roomId;

  const maxPeriod = detectMaxPeriod(students, inScope);
  const periodRange = Array.from({ length: maxPeriod }, (_, i) => i + 1);

  // 종일(0) 신청은 모든 교시 칸에 반영됩니다.
  const matchesPeriod = (status: PeriodStatus, period: number) =>
    status.period === period || status.period === 0;

  const header: (string | number)[] = ['학번', '이름'];
  daysWithData.forEach(date => {
    const label = format(date, 'MM/dd');
    periodRange.forEach(period => header.push(`${label} ${period}`));
  });

  const checkerRow: (string | number)[] = ['', ''];
  daysWithData.forEach(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    periodRange.forEach(period => {
      const checkerNames = new Set<string>();
      students.forEach(student => {
        (student.attendance[dateStr] ?? [])
          .filter(status => inScope(status) && matchesPeriod(status, period))
          .forEach(status => {
            if (status.checkerName) checkerNames.add(status.checkerName);
          });
      });
      checkerRow.push(Array.from(checkerNames).join('/'));
    });
  });

  const dataRows = students.map(student => {
    const row: (string | number)[] = [
      student.studentNumber || student.email.split('@')[0],
      student.name,
    ];

    daysWithData.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayStatuses = (student.attendance[dateStr] ?? []).filter(inScope);

      periodRange.forEach(period => {
        const matches = dayStatuses.filter(status => matchesPeriod(status, period));

        if (matches.length === 0) {
          row.push('');
        } else if (matches.length === 1) {
          row.push(isPresent(matches[0].status) ? 1 : 0);
        } else {
          // 중복 신청: 열람실별 출석 상태를 "열람실명:1" 형태로 병합
          row.push(
            matches
              .map(status => {
                const value = isPresent(status.status) ? '1' : '0';
                return status.roomName ? `${status.roomName}:${value}` : value;
              })
              .join('/')
          );
        }
      });
    });

    return row;
  });

  return [header, checkerRow, ...dataRows];
};

/** 열람실별로 시트를 나눠 Excel 내보내기용 데이터를 만듭니다. */
export const buildAttendanceSheets = (
  students: StudentDailyAttendance[],
  daysWithData: Date[]
): AttendanceSheet[] => {
  const roomMap = new Map<string, { roomName: string; studentIds: Set<string> }>();

  students.forEach(student => {
    Object.values(student.attendance).forEach(periods => {
      periods.forEach(period => {
        if (!period.roomId || !period.roomName) return;
        if (!roomMap.has(period.roomId)) {
          roomMap.set(period.roomId, { roomName: period.roomName, studentIds: new Set() });
        }
        roomMap.get(period.roomId)!.studentIds.add(student.studentId);
      });
    });
  });

  // 열람실 정보가 없으면 전체를 하나의 시트로
  if (roomMap.size === 0) {
    return [
      {
        sheetName: '전체',
        data: buildAttendanceMatrix(students, daysWithData),
      },
    ];
  }

  return Array.from(roomMap.entries()).map(([roomId, { roomName, studentIds }]) => ({
    sheetName: roomName,
    data: buildAttendanceMatrix(
      students.filter(student => studentIds.has(student.studentId)),
      daysWithData,
      roomId
    ),
  }));
};
