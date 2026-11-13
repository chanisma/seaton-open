import { describe, expect, it } from 'vitest';
import type { StudentDailyAttendance } from '@services/statistics.service';
import { buildAttendanceMatrix, buildAttendanceSheets, getDaysWithData } from './attendanceExport';

const START = new Date(2026, 6, 1); // 2026-07-01
const END = new Date(2026, 6, 3); // 2026-07-03

const students: StudentDailyAttendance[] = [
  {
    studentId: 's1',
    email: 'user212@example.com',
    name: '김하나',
    grade: 1,
    classNum: 1,
    number: 1,
    studentNumber: '10101',
    attendance: {
      '2026-07-01': [
        {
          period: 1,
          status: 'attended',
          checkerName: '박교사',
          roomId: 'r1',
          roomName: '야간 열람실',
        },
        {
          period: 2,
          status: 'absent',
          checkerName: '박교사',
          roomId: 'r1',
          roomName: '야간 열람실',
        },
      ],
    },
  },
  {
    studentId: 's2',
    email: 'user213@example.com',
    name: '이두리',
    grade: 1,
    classNum: 1,
    number: 2,
    attendance: {
      '2026-07-01': [{ period: 1, status: 'excused', roomId: 'r2', roomName: '아침 자습실' }],
    },
  },
];

describe('getDaysWithData', () => {
  it('신청이 하나라도 있는 날짜만 남긴다', () => {
    const days = getDaysWithData(students, START, END);
    expect(days).toHaveLength(1);
    expect(days[0].getDate()).toBe(1);
  });

  it('데이터가 없으면 빈 배열을 반환한다', () => {
    expect(getDaysWithData([], START, END)).toEqual([]);
  });
});

describe('buildAttendanceMatrix', () => {
  const days = getDaysWithData(students, START, END);

  it('헤더는 날짜×교시로 만들어진다', () => {
    const [header] = buildAttendanceMatrix(students, days);
    expect(header).toEqual(['학번', '이름', '07/01 1', '07/01 2']);
  });

  it('두 번째 행은 교시별 체크 교사다', () => {
    const [, checkerRow] = buildAttendanceMatrix(students, days);
    expect(checkerRow).toEqual(['', '', '박교사', '박교사']);
  });

  it('출석은 1, 결석은 0으로 쓴다', () => {
    const [, , row1] = buildAttendanceMatrix(students, days);
    expect(row1).toEqual(['10101', '김하나', 1, 0]);
  });

  it('인정출석(excused)도 출석으로 집계한다', () => {
    const [, , , row2] = buildAttendanceMatrix(students, days);
    expect(row2[2]).toBe(1);
  });

  it('학번이 없으면 이메일 앞부분을 쓰고, 없는 교시는 빈 칸으로 둔다', () => {
    const [, , , row2] = buildAttendanceMatrix(students, days);
    expect(row2[0]).toBe('00-00449');
    expect(row2[3]).toBe('');
  });

  it('종일(period 0) 신청은 모든 교시 칸에 반영된다', () => {
    const wholeDay: StudentDailyAttendance[] = [
      {
        ...students[0],
        attendance: {
          '2026-07-01': [{ period: 0, status: 'attended', roomId: 'r1', roomName: '야간 열람실' }],
        },
      },
    ];
    const wholeDayDays = getDaysWithData(wholeDay, START, END);
    const [header, , row] = buildAttendanceMatrix(wholeDay, wholeDayDays);

    // 교시 데이터가 없으므로 1컬럼으로 접힌다
    expect(header).toEqual(['학번', '이름', '07/01 1']);
    expect(row[2]).toBe(1);
  });

  it('같은 교시에 중복 신청이 있으면 열람실별 상태를 합쳐서 쓴다', () => {
    const duplicated: StudentDailyAttendance[] = [
      {
        ...students[0],
        attendance: {
          '2026-07-01': [
            { period: 1, status: 'attended', roomId: 'r1', roomName: '야간 열람실' },
            { period: 1, status: 'absent', roomId: 'r2', roomName: '아침 자습실' },
          ],
        },
      },
    ];
    const dupDays = getDaysWithData(duplicated, START, END);
    const [, , row] = buildAttendanceMatrix(duplicated, dupDays);

    expect(row[2]).toBe('야간 열람실:1/아침 자습실:0');
  });

  it('roomId를 주면 해당 열람실 신청만 남긴다', () => {
    const [header, , row1] = buildAttendanceMatrix(students, days, 'r1');
    expect(header).toEqual(['학번', '이름', '07/01 1', '07/01 2']);
    expect(row1).toEqual(['10101', '김하나', 1, 0]);

    const [, , , row2] = buildAttendanceMatrix(students, days, 'r1');
    // s2는 r2 소속이므로 r1 시트에서는 값이 비어 있다
    expect(row2[2]).toBe('');
  });
});

describe('buildAttendanceSheets', () => {
  it('열람실별로 시트를 나눈다', () => {
    const days = getDaysWithData(students, START, END);
    const sheets = buildAttendanceSheets(students, days);

    expect(sheets.map(s => s.sheetName).sort()).toEqual(['아침 자습실', '야간 열람실']);
  });

  it('열람실 정보가 없으면 전체 시트 하나로 만든다', () => {
    const noRoom: StudentDailyAttendance[] = [
      {
        ...students[0],
        attendance: { '2026-07-01': [{ period: 1, status: 'attended' }] },
      },
    ];
    const days = getDaysWithData(noRoom, START, END);
    const sheets = buildAttendanceSheets(noRoom, days);

    expect(sheets).toHaveLength(1);
    expect(sheets[0].sheetName).toBe('전체');
  });
});
