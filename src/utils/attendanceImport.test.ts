import { describe, expect, it } from 'vitest';
import { exactStudentId, resolveStudentIds, studentEmailOf } from './attendanceImport';

describe('attendanceImport', () => {
  it('7자리 학번은 meta.id 형식으로 확정한다', () => {
    expect(exactStudentId('00-00597')).toBe('00-00597');
    expect(exactStudentId('2510719')).toBe('00-00597');
    expect(exactStudentId('10719')).toBeNull();
  });

  it('학생 이메일 = meta.id@myschool.hs.kr', () => {
    expect(studentEmailOf('00-00597')).toBe('user333@example.com');
  });

  it('정확한 학번은 정확히, 짧은 번호는 딱 하나일 때만 매칭한다', () => {
    const map = resolveStudentIds(
      ['00-00597', '2410101', '10719', '20419', '99999'],
      ['00-00597', '24-20419', '25-20419']
    );
    expect(map.get('00-00597')).toBe('00-00597');
    expect(map.has('2410101')).toBe(false);
    expect(map.get('10719')).toBe('00-00597');
    expect(map.has('20419')).toBe(false); // 두 학생에 걸리면 모호 → 매칭 안 함
    expect(map.has('99999')).toBe(false);
  });
});
