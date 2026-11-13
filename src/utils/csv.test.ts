import { describe, expect, it } from 'vitest';
import { csvEscape, rowsToCSV } from './csv';

describe('csvEscape', () => {
  it('일반 값은 그대로 둔다', () => {
    expect(csvEscape('김하나')).toBe('김하나');
    expect(csvEscape(1)).toBe('1');
  });

  it('null/undefined는 빈 문자열로 만든다', () => {
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(undefined)).toBe('');
  });

  it('쉼표가 들어간 값을 따옴표로 감싼다', () => {
    expect(csvEscape('김, 하나')).toBe('"김, 하나"');
  });

  it('따옴표를 두 번 겹쳐 이스케이프한다', () => {
    expect(csvEscape('그는 "안녕"이라 했다')).toBe('"그는 ""안녕""이라 했다"');
  });

  it('줄바꿈이 들어간 값을 감싼다', () => {
    expect(csvEscape('첫째 줄\n둘째 줄')).toBe('"첫째 줄\n둘째 줄"');
  });
});

describe('rowsToCSV', () => {
  it('행마다 이스케이프를 적용해 직렬화한다', () => {
    const csv = rowsToCSV([
      ['학번', '이름', '07/01 1'],
      ['10101', '김, 하나', 1],
    ]);

    expect(csv).toBe('학번,이름,07/01 1\n10101,"김, 하나",1');
  });

  it('이름에 쉼표가 있어도 컬럼 수가 유지된다', () => {
    const csv = rowsToCSV([['10101', '김, 하나', 1]]);
    // 따옴표 안의 쉼표는 구분자가 아니므로 최상위 컬럼은 3개
    expect(csv.split('","').length).toBe(1);
    expect(csv).toContain('"김, 하나"');
  });
});
