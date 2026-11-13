import { describe, expect, it } from 'vitest';
import { parseAttendanceCSV } from './statistics.service';

describe('parseAttendanceCSV', () => {
  it('학번/이름/날짜·교시 컬럼을 파싱한다', () => {
    const csv = ['학번,이름,07/01 1,07/01 2', '10101,김하나,1,0'].join('\n');
    const { items, errors } = parseAttendanceCSV(csv, 2026);

    expect(errors).toEqual([]);
    expect(items).toHaveLength(2);
    expect(items[0]).toEqual({
      studentNumber: '10101',
      name: '김하나',
      date: '2026-07-01',
      period: 1,
      isAttended: true,
    });
    expect(items[1].isAttended).toBe(false);
  });

  it('MM/dd를 인자로 받은 연도와 합쳐 YYYY-MM-DD로 만든다', () => {
    const csv = ['학번,이름,1/5 1', '10101,김하나,1'].join('\n');
    const { items } = parseAttendanceCSV(csv, 2025);

    expect(items[0].date).toBe('2025-01-05');
  });

  it('O/o/true도 출석으로 인정한다', () => {
    const csv = ['학번,이름,07/01 1,07/01 2,07/01 3', '10101,김하나,O,o,true'].join('\n');
    const { items } = parseAttendanceCSV(csv, 2026);

    expect(items.every(item => item.isAttended)).toBe(true);
  });

  it('빈 칸은 항목으로 만들지 않는다', () => {
    const csv = ['학번,이름,07/01 1,07/01 2', '10101,김하나,1,'].join('\n');
    const { items } = parseAttendanceCSV(csv, 2026);

    expect(items).toHaveLength(1);
  });

  it('데이터 행이 없으면 오류를 낸다', () => {
    const { errors } = parseAttendanceCSV('학번,이름,07/01 1', 2026);
    expect(errors).toHaveLength(1);
  });

  it('날짜/교시 헤더가 없으면 오류를 낸다', () => {
    const csv = ['학번,이름,비고', '10101,김하나,x'].join('\n');
    const { items, errors } = parseAttendanceCSV(csv, 2026);

    expect(items).toEqual([]);
    expect(errors[0]).toMatch(/날짜\/교시/);
  });

  it('학번이 비어 있는 행은 오류로 보고한다', () => {
    const csv = ['학번,이름,07/01 1', ',,1'].join('\n');
    const { errors } = parseAttendanceCSV(csv, 2026);

    expect(errors[0]).toMatch(/학번이 비어있습니다/);
  });
});
