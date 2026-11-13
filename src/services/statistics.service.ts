import { supabase } from '@/lib/supabase';
import {
  format,
  startOfWeek,
  endOfWeek,
  isBefore,
  isSameDay,
  isAfter,
  parseISO,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { enrichWithResourceMeta, getStudentIdsByGrade } from '@utils/resourceEnrichment';
import {
  digitsOnly,
  exactStudentId,
  resolveStudentIds,
  studentEmailOf,
} from '@utils/attendanceImport';
import { ABSENCE_DECREMENT, ATTENDANCE_INCREMENT, BASE_TEMPERATURE } from '@utils/temperature';

// 통계 데이터 타입
export interface GradeStatistics {
  grade: number;
  totalReservations: number;
  attended: number;
  attendanceRate: number;
}

export interface MonthlyStatistics {
  month: string; // 'YYYY-MM' format
  totalReservations: number;
  attended: number;
  attendanceRate: number;
  byGrade: {
    [grade: number]: {
      totalReservations: number;
      attended: number;
      attendanceRate: number;
    };
  };
}

export interface WeeklyStatistics {
  week: string; // 'MM/DD' format (주의 시작일)
  weekLabel: string; // 'M월 W주차' format
  startDate: string; // 'YYYY-MM-DD' format
  endDate: string; // 'YYYY-MM-DD' format
  totalReservations: number;
  attended: number;
  attendanceRate: number;
  byGrade: {
    [grade: number]: {
      totalReservations: number;
      attended: number;
      attendanceRate: number;
    };
  };
}

export interface RoomStatistics {
  roomId: string;
  roomName: string;
  grade: number;
  totalReservations: number;
  attended: number;
  attendanceRate: number;
}

export interface OverallStatistics {
  totalReservations: number;
  totalAttended: number;
  totalAbsent: number;
  overallAttendanceRate: number;
  uniqueStudents: number;
  activeRooms: number;
}

export interface WeekdayCrosstab {
  roomId: string;
  roomName: string;
  /** 요일별 신청 수 (0=일, 1=월, ..., 5=금, 6=토) */
  byDay: Record<number, number>;
  total: number;
  /** 월~금 사이 중복 제외 고유 학생 수 */
  uniqueStudents: number;
}

export interface DashboardStatistics {
  todayApplicants: number;
  todayApplicantsByGrade: { [key: number]: number };
  weeklyApplicants: number;
  weeklyApplicantsByGrade: { [key: number]: number };
  averageAttendanceRate: number;
  attendanceRateByGrade: { [key: number]: number };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 날짜 범위를 계산하고 포맷된 문자열을 반환합니다.
 * includeFuture가 false이면 오늘 이후의 날짜는 오늘로 제한됩니다.
 */
function getEffectiveDateRange(
  startDate: Date,
  endDate: Date,
  includeFuture: boolean
): { startStr: string; endStr: string } {
  const startStr = format(startDate, 'yyyy-MM-dd');
  const today = startOfDay(new Date());
  let effectiveEndDate = endOfDay(endDate);

  if (!includeFuture && isAfter(effectiveEndDate, endOfDay(today))) {
    effectiveEndDate = endOfDay(today);
  }

  return { startStr, endStr: format(effectiveEndDate, 'yyyy-MM-dd') };
}

/**
 * resource.meta에서 가장 최신 학번(snum{N})을 추출합니다.
 */
function getLatestStudentNumber(meta: Record<string, any>): string | null {
  let maxSnumKey = '';
  let maxSuffix = 0;

  Object.keys(meta).forEach(key => {
    if (key.startsWith('snum')) {
      const suffix = parseInt(key.replace('snum', ''), 10);
      if (!isNaN(suffix) && suffix > maxSuffix) {
        maxSuffix = suffix;
        maxSnumKey = key;
      }
    }
  });

  return maxSnumKey ? meta[maxSnumKey] : null;
}

// ============================================================================
// Statistics Functions
// ============================================================================

/**
 * 학년별 통계 조회
 */
export const getGradeStatistics = async (
  startDate: Date,
  endDate: Date,
  grade?: number | null,
  includeFuture: boolean = false
): Promise<GradeStatistics[]> => {
  const { startStr, endStr } = getEffectiveDateRange(startDate, endDate, includeFuture);

  const { data, error } = await supabase.rpc('get_grade_statistics', {
    start_date: startStr,
    end_date: endStr,
    target_grade: grade || null,
  } as any);

  if (error) {
    console.error('Error fetching grade statistics:', error);
    throw new Error('학년별 통계를 불러오는데 실패했습니다.');
  }

  return ((data as any[]) || []).map((item: any) => ({
    grade: item.grade,
    totalReservations: item.total_reservations,
    attended: item.attended,
    attendanceRate: item.attendance_rate,
  }));
};

/**
 * 월별 통계 조회
 */
export const getMonthlyStatistics = async (
  startDate: Date,
  endDate: Date,
  grade?: number | null,
  includeFuture: boolean = false
): Promise<MonthlyStatistics[]> => {
  const { startStr, endStr } = getEffectiveDateRange(startDate, endDate, includeFuture);

  const { data, error } = await supabase.rpc('get_monthly_statistics', {
    start_date: startStr,
    end_date: endStr,
    target_grade: grade || null,
  } as any);

  if (error) {
    console.error('Error fetching monthly statistics:', error);
    throw new Error('월별 통계를 불러오는데 실패했습니다.');
  }

  return ((data as any[]) || []).map((item: any) => ({
    month: item.month,
    totalReservations: item.total_reservations,
    attended: item.attended,
    attendanceRate: item.attendance_rate,
    byGrade: item.by_grade,
  }));
};

/**
 * 주별 통계 조회 (일별 데이터를 주별로 집계)
 */
export const getWeeklyStatistics = async (
  startDate: Date,
  endDate: Date,
  grade?: number | null,
  includeFuture: boolean = false
): Promise<WeeklyStatistics[]> => {
  const { startStr, endStr } = getEffectiveDateRange(startDate, endDate, includeFuture);

  // 일별 데이터 조회
  const { data, error } = await supabase.rpc('get_daily_statistics', {
    start_date: startStr,
    end_date: endStr,
    target_grade: grade || null,
  } as any);

  if (error) {
    console.error('Error fetching daily statistics for weekly aggregation:', error);
    throw new Error('주별 통계를 불러오는데 실패했습니다.');
  }

  // 일별 데이터를 주별로 집계
  const weeklyMap = new Map<
    string,
    {
      startDate: Date;
      endDate: Date;
      totalReservations: number;
      attended: number;
      byGrade: { [grade: number]: { totalReservations: number; attended: number } };
    }
  >();

  ((data as any[]) || []).forEach((item: any) => {
    const date = parseISO(item.date);
    const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // 월요일 시작
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
    const weekKey = format(weekStart, 'yyyy-MM-dd');

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, {
        startDate: weekStart,
        endDate: weekEnd,
        totalReservations: 0,
        attended: 0,
        byGrade: {
          1: { totalReservations: 0, attended: 0 },
          2: { totalReservations: 0, attended: 0 },
          3: { totalReservations: 0, attended: 0 },
        },
      });
    }

    const weekData = weeklyMap.get(weekKey)!;
    weekData.totalReservations += item.total_reservations || 0;
    weekData.attended += item.attended || 0;

    // 학년별 집계
    if (item.by_grade) {
      [1, 2, 3].forEach(g => {
        if (item.by_grade[g]) {
          weekData.byGrade[g].totalReservations += item.by_grade[g].total_reservations || 0;
          weekData.byGrade[g].attended += item.by_grade[g].attended || 0;
        }
      });
    }
  });

  // Map을 배열로 변환하고 정렬
  const result: WeeklyStatistics[] = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([_, data]) => {
      const month = data.startDate.getMonth() + 1;
      // 해당 월의 몇 번째 주인지 계산
      const firstDayOfMonth = new Date(data.startDate.getFullYear(), data.startDate.getMonth(), 1);
      const firstWeekStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
      const weekNumber =
        Math.ceil(
          (data.startDate.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
        ) + 1;

      const byGradeWithRate: WeeklyStatistics['byGrade'] = {};
      [1, 2, 3].forEach(g => {
        const gradeData = data.byGrade[g];
        byGradeWithRate[g] = {
          totalReservations: gradeData.totalReservations,
          attended: gradeData.attended,
          attendanceRate:
            gradeData.totalReservations > 0
              ? Math.round((gradeData.attended / gradeData.totalReservations) * 100)
              : 0,
        };
      });

      return {
        week: format(data.startDate, 'MM/dd'),
        weekLabel: `${month}월 ${weekNumber}주`,
        startDate: format(data.startDate, 'yyyy-MM-dd'),
        endDate: format(data.endDate, 'yyyy-MM-dd'),
        totalReservations: data.totalReservations,
        attended: data.attended,
        attendanceRate:
          data.totalReservations > 0
            ? Math.round((data.attended / data.totalReservations) * 100)
            : 0,
        byGrade: byGradeWithRate,
      };
    });

  return result;
};

/**
 * 열람실별 통계 조회
 */
export const getRoomStatistics = async (
  startDate: Date,
  endDate: Date,
  grade?: number | null,
  includeFuture: boolean = false
): Promise<RoomStatistics[]> => {
  const { startStr, endStr } = getEffectiveDateRange(startDate, endDate, includeFuture);

  const { data, error } = await supabase.rpc('get_room_statistics', {
    start_date: startStr,
    end_date: endStr,
    target_grade: grade || null,
  } as any);

  if (error) {
    console.error('Error fetching room statistics:', error);
    throw new Error('열람실별 통계를 불러오는데 실패했습니다.');
  }

  return ((data as any[]) || []).map((item: any) => ({
    roomId: item.room_id,
    roomName: item.room_name,
    grade: item.grade,
    totalReservations: item.total_reservations,
    attended: item.attended,
    attendanceRate: item.attendance_rate,
  }));
};

/**
 * 서버 집계 RPC(20261001_statistics_bundle_rpcs.sql) 사용 가능 여부.
 * null=미확인, true=사용, false=미배포(기존 클라이언트 집계로 폴백)
 */
const statsRpcAvailable: Record<'bundle' | 'crosstab', boolean | null> = {
  bundle: null,
  crosstab: null,
};

/** 함수가 아직 배포되지 않은 경우(PGRST202: 스키마 캐시에 없음, 42883: 정의 안 됨) */
const isMissingFunctionError = (error: { code?: string } | null) =>
  error?.code === 'PGRST202' || error?.code === '42883';

/**
 * 요일별 신청 교차표 (열람실 × 요일) 조회
 * get_weekday_crosstab RPC로 서버에서 집계하고, RPC가 없거나 실패하면 기존 방식으로 폴백합니다.
 */
export const getWeekdayCrosstab = async (
  startDate: Date,
  endDate: Date,
  grade?: number | null,
  includeFuture: boolean = false
): Promise<WeekdayCrosstab[]> => {
  const { startStr, endStr } = getEffectiveDateRange(startDate, endDate, includeFuture);

  if (statsRpcAvailable.crosstab !== false) {
    const { data, error } = await supabase.rpc('get_weekday_crosstab', {
      p_start: startStr,
      p_end: endStr,
      p_grade: grade || null,
    } as any);

    if (!error && data) {
      statsRpcAvailable.crosstab = true;
      return ((data as any[]) || [])
        .map(row => ({
          roomId: row.room_id as string,
          roomName: row.room_name as string,
          byDay: row.by_day as Record<number, number>,
          total: Number(row.total),
          uniqueStudents: Number(row.unique_students),
        }))
        .sort((a, b) => a.roomName.localeCompare(b.roomName, 'ko'));
    }

    if (isMissingFunctionError(error)) statsRpcAvailable.crosstab = false;
    console.warn('get_weekday_crosstab RPC 실패, 클라이언트 집계로 폴백합니다:', error);
  }

  return getWeekdayCrosstabFromRows(startStr, endStr, grade);
};

/** 요일별 교차표 — 예약 원본을 받아 클라이언트에서 집계 (RPC 폴백용) */
const getWeekdayCrosstabFromRows = async (
  startStr: string,
  endStr: string,
  grade?: number | null
): Promise<WeekdayCrosstab[]> => {
  // 학년 필터가 있으면 해당 학년 학생 ID 목록 가져오기
  let studentIds: string[] | null = null;
  if (grade) {
    studentIds = await getStudentIdsByGrade(grade);
    if (studentIds.length === 0) return [];
  }

  // Supabase 기본 limit이 1000이므로 페이지네이션으로 전체 조회
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    // ORDER BY가 없으면 페이지 간 행 순서가 보장되지 않아 중복/누락이 발생할 수 있습니다.
    let query = supabase
      .from('seat_reservations')
      .select('id, reservation_date, room_id, student_id, study_rooms(id, name)')
      .gte('reservation_date', startStr)
      .lte('reservation_date', endStr)
      .order('id')
      .range(offset, offset + PAGE_SIZE - 1);

    if (studentIds) {
      query = query.in('student_id', studentIds);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching weekday crosstab:', error);
      throw new Error('요일별 통계를 불러오는데 실패했습니다.');
    }

    allData = allData.concat(data || []);
    hasMore = (data?.length || 0) === PAGE_SIZE;
    offset += PAGE_SIZE;
  }

  // 동일 날짜+강의실+학생 중복 제거 (교시가 여러 개여도 1명으로 카운트)
  const seen = new Set<string>();
  const roomMap = new Map<
    string,
    { roomName: string; byDay: Record<number, number>; weekdayStudents: Set<string> }
  >();

  for (const row of allData as any[]) {
    const roomId = row.room_id as string;
    const studentId = row.student_id as string;
    const dateStr = row.reservation_date as string;
    const dedupeKey = `${roomId}:${dateStr}:${studentId}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    const roomInfo = row.study_rooms as any;
    const roomName =
      ((Array.isArray(roomInfo) ? roomInfo[0]?.name : roomInfo?.name) as string) || '알 수 없음';
    const parts = dateStr.split('-').map(Number);
    const dayOfWeek = new Date(parts[0], parts[1] - 1, parts[2]).getDay();

    if (!roomMap.has(roomId)) {
      roomMap.set(roomId, {
        roomName,
        byDay: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        weekdayStudents: new Set<string>(),
      });
    }
    const entry = roomMap.get(roomId)!;
    entry.byDay[dayOfWeek]++;
    // 월(1) ~ 금(5) 사이의 신청만 고유 학생 집계 대상
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      entry.weekdayStudents.add(studentId);
    }
  }

  // 강의실 이름 가나다순 정렬
  return Array.from(roomMap.entries())
    .map(([roomId, { roomName, byDay, weekdayStudents }]) => ({
      roomId,
      roomName,
      byDay,
      total: Object.values(byDay).reduce((a, b) => a + b, 0),
      uniqueStudents: weekdayStudents.size,
    }))
    .sort((a, b) => a.roomName.localeCompare(b.roomName, 'ko'));
};

/**
 * 전체 통계 조회
 */
export const getOverallStatistics = async (
  startDate: Date,
  endDate: Date,
  grade?: number | null,
  includeFuture: boolean = false
): Promise<OverallStatistics> => {
  const { startStr, endStr } = getEffectiveDateRange(startDate, endDate, includeFuture);

  const { data, error } = await supabase.rpc('get_overall_statistics', {
    start_date: startStr,
    end_date: endStr,
    target_grade: grade || null,
  } as any);

  if (error) {
    console.error('Error fetching overall statistics:', error);
    throw new Error('전체 통계를 불러오는데 실패했습니다.');
  }

  const item = (data as any[])?.[0] || {
    total_reservations: 0,
    total_attended: 0,
    total_absent: 0,
    overall_attendance_rate: 0,
    unique_students: 0,
    active_rooms: 0,
  };

  return {
    totalReservations: item.total_reservations,
    totalAttended: item.total_attended,
    totalAbsent: item.total_absent,
    overallAttendanceRate: item.overall_attendance_rate,
    uniqueStudents: item.unique_students,
    activeRooms: item.active_rooms,
  };
};

export interface StudentStatistics {
  studentId: string;
  email: string;
  name: string;
  grade: number;
  classNum: number;
  number: number;
  studentNumber?: string; // 학번 (resource.meta.snum{N})
  totalReservations: number;
  attended: number;
  absent: number;
  temperatureChange: number; // 기간 내 온도 변화량
  currentTemperature: number; // 현재 총 온도
  weekdayRooms: Record<number, string[]>; // 요일별 신청 열람실 (1=월 ~ 5=금)
}

export interface PeriodStatus {
  period: number;
  status: 'attended' | 'excused' | 'absent' | 'none';
  checkerName?: string; // 출석 체크한 교사 이름
  roomId?: string; // 열람실 ID
  roomName?: string; // 열람실 이름
}

export interface StudentDailyAttendance {
  studentId: string;
  email: string;
  name: string;
  grade: number;
  classNum: number;
  number: number;
  studentNumber?: string; // 학번 (resource.meta.snum{N})
  attendance: Record<string, PeriodStatus[]>;
}

export interface TemperatureRanking {
  rank: number;
  studentId: string;
  name: string;
  grade: number;
  class: string;
  temperature: number;
  monthlyChange: number;
}

// ============================================================================
// 학생별 통계 / 일별 출석 — 단일 페치 번들
// ============================================================================

/**
 * 전교 온도 랭킹 캐시.
 * get_temperature_ranking은 인자가 없어 전교생을 모두 반환하므로 반복 호출을 피합니다.
 */
let temperatureCache: { data: Map<string, number>; ts: number } | null = null;
const TEMPERATURE_TTL_MS = 2 * 60 * 1000;

/**
 * 필터형 온도 RPC 사용 가능 여부.
 * null=미확인, true=사용, false=미배포(전체 랭킹 폴백)
 */
let filteredTemperatureRpcAvailable: boolean | null = null;

/**
 * 대상 학생들의 현재 온도를 조회합니다.
 *
 * get_temperatures_for_students RPC(마이그레이션 20260728)가 있으면 필요한 학생만 조회하고,
 * 아직 적용되지 않은 환경에서는 전교 랭킹을 받아 클라이언트에서 걸러냅니다.
 * (폴백 경로는 캐시를 사용하므로 반복 호출해도 요청은 2분에 한 번입니다.)
 */
const fetchTemperatureMap = async (studentIds: string[]): Promise<Map<string, number>> => {
  const result = new Map<string, number>();
  if (studentIds.length === 0) return result;

  if (filteredTemperatureRpcAvailable !== false) {
    const { data, error } = await supabase.rpc('get_temperatures_for_students', {
      student_ids: studentIds,
    });

    if (!error && data) {
      filteredTemperatureRpcAvailable = true;
      data.forEach(item => {
        result.set(item.student_id, item.temperature);
      });
      return result;
    }

    filteredTemperatureRpcAvailable = false;
  }

  if (!temperatureCache || Date.now() - temperatureCache.ts >= TEMPERATURE_TTL_MS) {
    const { data, error } = await supabase.rpc('get_temperature_ranking');

    if (error || !data) {
      console.error('Error fetching temperatures:', error);
      return result;
    }

    const all = new Map<string, number>();
    (data as { student_id: string; temperature: number }[]).forEach(item => {
      all.set(item.student_id, item.temperature);
    });
    temperatureCache = { data: all, ts: Date.now() };
  }

  studentIds.forEach(id => {
    const temperature = temperatureCache!.data.get(id);
    if (temperature !== undefined) result.set(id, temperature);
  });

  return result;
};

/**
 * 이메일 로컬 파트(=resource.meta.id)별 최신 학번을 조회합니다.
 * 이전에는 이 블록이 두 함수에 복사되어 있었고 O(학생수 × resource수) 중첩 루프였습니다.
 */
const fetchStudentNumbers = async (emails: Iterable<string>): Promise<Map<string, string>> => {
  const ids = Array.from(
    new Set(
      Array.from(emails)
        .map(email => email.split('@')[0])
        .filter(Boolean)
    )
  );

  const numbers = new Map<string, string>();
  if (ids.length === 0) return numbers;

  const { data, error } = await supabase.from('resource').select('meta').in('meta->>id', ids);

  if (error) {
    console.error('Error fetching student numbers:', error);
    return numbers;
  }

  (data as any[] | null)?.forEach(row => {
    const metaId = row.meta?.id;
    if (!metaId) return;

    const studentNumber = getLatestStudentNumber(row.meta);
    if (studentNumber) numbers.set(String(metaId), studentNumber);
  });

  return numbers;
};

interface SortableStudent {
  studentNumber?: string;
  grade: number;
  classNum: number;
  number: number;
}

/** 학번 우선, 없으면 학년/반/번호 순으로 정렬합니다. (null은 0으로 취급해 NaN 비교 방지) */
const compareStudents = (a: SortableStudent, b: SortableStudent): number => {
  if (a.studentNumber && b.studentNumber) return a.studentNumber.localeCompare(b.studentNumber);
  if (a.studentNumber) return -1;
  if (b.studentNumber) return 1;
  if ((a.grade ?? 0) !== (b.grade ?? 0)) return (a.grade ?? 0) - (b.grade ?? 0);
  if ((a.classNum ?? 0) !== (b.classNum ?? 0)) return (a.classNum ?? 0) - (b.classNum ?? 0);
  return (a.number ?? 0) - (b.number ?? 0);
};

/**
 * 기간 내 예약 원본을 조회합니다. (페이지네이션 + resource.meta 병합)
 * 페이지마다 새 쿼리 빌더를 만들고 ORDER BY를 고정해야 중복/누락이 없습니다.
 */
const fetchReservationRows = async (
  startStr: string,
  endStr: string,
  grade?: number | null,
  roomId?: string | null
): Promise<any[]> => {
  let gradeStudentIds: string[] | null = null;
  if (grade) {
    gradeStudentIds = await getStudentIdsByGrade(grade);
    if (gradeStudentIds.length === 0) return [];
  }

  const buildQuery = () => {
    let query = supabase
      .from('seat_reservations')
      .select(
        '*, profiles!student_id!inner(id, email, name), checker:profiles!checked_by(id, name), study_rooms!room_id(id, name)'
      )
      .gte('reservation_date', startStr)
      .lte('reservation_date', endStr);

    if (gradeStudentIds) query = query.in('student_id', gradeStudentIds);
    if (roomId) query = query.eq('room_id', roomId);

    return query;
  };

  const rows: any[] = [];
  const pageSize = 1000;

  for (let page = 0; ; page++) {
    const { data, error } = await buildQuery()
      .order('id')
      .range(page * pageSize, (page + 1) * pageSize - 1)
      .returns<any[]>();

    if (error) throw error;
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < pageSize) break;
  }

  return enrichWithResourceMeta(rows);
};

/** 예약 원본 한 벌에서 학생별 통계와 일별 출석 현황을 동시에 만듭니다. */
const aggregateStatsBundle = (
  rows: any[],
  temperatures: Map<string, number>,
  studentNumbers: Map<string, string>
): StatsBundle => {
  const today = startOfDay(new Date());
  const isPastClosingTime = new Date().getHours() >= 23;

  // 같은 날 여러 교시를 신청하면 온도 변화에 1/N 가중치를 적용합니다.
  const dailyCounts = new Map<string, number>();
  rows.forEach(row => {
    const profileId = row.profiles?.id;
    if (!profileId) return;
    const key = `${profileId}:${row.reservation_date}`;
    dailyCounts.set(key, (dailyCounts.get(key) ?? 0) + 1);
  });

  const statsMap = new Map<string, StudentStatistics>();
  const attendanceMap = new Map<string, StudentDailyAttendance>();

  rows.forEach(row => {
    const profile = row.profiles;
    if (!profile) return;

    if (!statsMap.has(profile.id)) {
      const studentNumber = studentNumbers.get(String(profile.email ?? '').split('@')[0]);
      const identity = {
        studentId: profile.id,
        email: profile.email,
        name: profile.name,
        grade: profile.grade,
        classNum: profile.class,
        number: profile.student_number,
        studentNumber,
      };

      statsMap.set(profile.id, {
        ...identity,
        totalReservations: 0,
        attended: 0,
        absent: 0,
        temperatureChange: 0,
        currentTemperature:
          Math.round((temperatures.get(profile.id) ?? BASE_TEMPERATURE) * 10) / 10,
        weekdayRooms: { 1: [], 2: [], 3: [], 4: [], 5: [] },
      });
      attendanceMap.set(profile.id, { ...identity, attendance: {} });
    }

    const stats = statsMap.get(profile.id)!;
    const daily = attendanceMap.get(profile.id)!;

    const dateStr: string = row.reservation_date;
    const reservationDate = startOfDay(parseISO(dateStr));
    const isMissed =
      isBefore(reservationDate, today) || (isSameDay(reservationDate, today) && isPastClosingTime);

    // --- 학생별 통계 ---
    stats.totalReservations++;

    const dayOfWeek = reservationDate.getDay(); // 0=일 ~ 6=토
    const roomName: string | undefined = row.study_rooms?.name;
    if (
      dayOfWeek >= 1 &&
      dayOfWeek <= 5 &&
      roomName &&
      !stats.weekdayRooms[dayOfWeek].includes(roomName)
    ) {
      stats.weekdayRooms[dayOfWeek].push(roomName);
    }

    const weight = 1 / (dailyCounts.get(`${profile.id}:${dateStr}`) || 1);

    if (row.is_attended) {
      stats.attended++;
      stats.temperatureChange += ATTENDANCE_INCREMENT * weight;
    } else if (isMissed) {
      stats.absent++;
      stats.temperatureChange -= ABSENCE_DECREMENT * weight;
    }
    // 아직 지나지 않은 예약은 출석/결석 어느 쪽으로도 세지 않습니다.

    // --- 일별 출석 현황 ---
    let status: PeriodStatus['status'] = 'none';
    if (row.attendance_status === 'excused') status = 'excused';
    else if (row.is_attended) status = 'attended';
    else if (isMissed) status = 'absent';

    if (!daily.attendance[dateStr]) daily.attendance[dateStr] = [];
    daily.attendance[dateStr].push({
      period: row.period_id,
      status,
      checkerName: row.checker?.name || undefined,
      roomId: row.study_rooms?.id || row.room_id,
      roomName: row.study_rooms?.name || undefined,
    });
  });

  // 부동소수 누적 오차가 화면에 그대로 노출되지 않도록 소수점 첫째 자리로 반올림
  statsMap.forEach(stats => {
    stats.temperatureChange = Math.round(stats.temperatureChange * 10) / 10;
  });

  attendanceMap.forEach(student => {
    Object.values(student.attendance).forEach(periods =>
      periods.sort((a, b) => a.period - b.period)
    );
  });

  return {
    statistics: Array.from(statsMap.values()).sort(compareStudents),
    dailyAttendance: Array.from(attendanceMap.values()).sort(compareStudents),
  };
};

export interface StatsBundle {
  statistics: StudentStatistics[];
  dailyAttendance: StudentDailyAttendance[];
}

const bundleCache = new Map<string, { data: StatsBundle; ts: number }>();
const BUNDLE_CACHE_TTL_MS = 2 * 60 * 1000;

export const invalidateStudentStatsBundleCache = () => {
  bundleCache.clear();
  temperatureCache = null;
};

/**
 * 학생별 통계 + 일별 출석 현황을 한 번에 계산합니다. (2분 TTL 캐시)
 *
 * 기본은 get_student_stats_bundle RPC로 서버에서 집계해 1회 요청으로 받습니다.
 * (학기 기준 예약 원본 약 24MB · 순차 요청 33회 → 약 1.4MB · 요청 1회)
 * RPC가 없거나 실패하면 예약 원본을 받아 클라이언트에서 집계하는 기존 방식으로 폴백합니다.
 */
export const getStudentStatsBundle = async (
  startDate: Date,
  endDate: Date,
  grade?: number | null,
  includeFuture: boolean = false,
  roomId?: string | null
): Promise<StatsBundle> => {
  const { startStr, endStr } = getEffectiveDateRange(startDate, endDate, includeFuture);
  const cacheKey = `${startStr}|${endStr}|${grade ?? ''}|${includeFuture}|${roomId ?? ''}`;

  const cached = bundleCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < BUNDLE_CACHE_TTL_MS) return cached.data;

  try {
    const bundle =
      (await fetchStatsBundleViaRpc(startStr, endStr, grade, roomId)) ??
      (await fetchStatsBundleFromRows(startStr, endStr, grade, roomId));
    bundleCache.set(cacheKey, { data: bundle, ts: Date.now() });
    return bundle;
  } catch (err) {
    console.error('getStudentStatsBundle exception:', err);
    throw err;
  }
};

/** get_student_stats_bundle RPC 응답의 학생 항목 (SQL 주석의 반환 형태 참고) */
interface StatsBundleRpcStudent {
  id: string;
  email: string;
  name: string | null;
  grade: number | null;
  class: number | null;
  sid: string | null;
  number: number | null;
  snum: string | null;
  total: number;
  attended: number;
  absent: number;
  /** 반올림 전 온도 변화량 합계 */
  temp: number | null;
  wr: Record<string, string[]>;
  /** 날짜 -> [교시, 상태, 확인 교사, rooms 인덱스][] */
  att: Record<string, [number, PeriodStatus['status'], string | null, number][]>;
}

/**
 * 서버(get_student_stats_bundle)에서 학생별 집계 + 일별 출석을 한 번에 받습니다.
 * RPC가 없거나 실패하면 null을 반환해 기존 클라이언트 집계로 폴백하게 합니다.
 *
 * 결과는 aggregateStatsBundle()과 같아야 합니다. 판정 기준(오늘·23시 마감·온도 상수)은
 * 클라이언트 값을 넘기고, 온도 반올림도 여기서 같은 방식으로 합니다.
 */
const fetchStatsBundleViaRpc = async (
  startStr: string,
  endStr: string,
  grade?: number | null,
  roomId?: string | null
): Promise<StatsBundle | null> => {
  if (statsRpcAvailable.bundle === false) return null;

  const now = new Date();
  const { data, error } = await supabase.rpc('get_student_stats_bundle', {
    p_start: startStr,
    p_end: endStr,
    p_today: format(startOfDay(now), 'yyyy-MM-dd'),
    p_past_closing: now.getHours() >= 23,
    p_attendance_increment: ATTENDANCE_INCREMENT,
    p_absence_decrement: ABSENCE_DECREMENT,
    p_grade: grade || null,
    p_room_id: roomId || null,
  } as any);

  if (error || !data) {
    if (isMissingFunctionError(error)) statsRpcAvailable.bundle = false;
    console.warn('get_student_stats_bundle RPC 실패, 클라이언트 집계로 폴백합니다:', error);
    return null;
  }
  statsRpcAvailable.bundle = true;

  const { rooms, students } = data as unknown as {
    rooms: [string, string | null][];
    students: StatsBundleRpcStudent[];
  };
  const temperatures = await fetchTemperatureMap(students.map(s => s.id));

  const statistics: StudentStatistics[] = [];
  const dailyAttendance: StudentDailyAttendance[] = [];

  students.forEach(s => {
    // enrichWithResourceMeta()와 동일하게: resource와 매칭된 학생만 학년/반/학번 키를 가지며
    // (값이 없으면 null), 매칭되지 않으면 키 자체가 비어 있습니다(undefined).
    const matched = s.sid !== null;
    const identity = {
      studentId: s.id,
      email: s.email,
      name: s.name as string,
      grade: (matched ? (s.grade ?? null) : undefined) as number,
      classNum: (matched ? (s.class ?? null) : undefined) as number,
      number: (matched ? s.sid : undefined) as unknown as number,
      studentNumber: s.snum || undefined,
    };

    statistics.push({
      ...identity,
      totalReservations: s.total,
      attended: s.attended,
      absent: s.absent,
      temperatureChange: Math.round((s.temp ?? 0) * 10) / 10,
      currentTemperature: Math.round((temperatures.get(s.id) ?? BASE_TEMPERATURE) * 10) / 10,
      weekdayRooms: { 1: s.wr['1'], 2: s.wr['2'], 3: s.wr['3'], 4: s.wr['4'], 5: s.wr['5'] },
    });

    const attendance: Record<string, PeriodStatus[]> = {};
    Object.entries(s.att).forEach(([dateStr, entries]) => {
      attendance[dateStr] = entries.map(([period, status, checkerName, roomIdx]) => ({
        period,
        status,
        checkerName: checkerName || undefined,
        roomId: rooms[roomIdx][0],
        roomName: rooms[roomIdx][1] || undefined,
      }));
    });
    dailyAttendance.push({ ...identity, attendance });
  });

  return {
    statistics: statistics.sort(compareStudents),
    dailyAttendance: dailyAttendance.sort(compareStudents),
  };
};

/** 예약 원본을 받아 클라이언트에서 집계 (RPC 폴백용) */
const fetchStatsBundleFromRows = async (
  startStr: string,
  endStr: string,
  grade?: number | null,
  roomId?: string | null
): Promise<StatsBundle> => {
  const rows = await fetchReservationRows(startStr, endStr, grade, roomId);

  const studentIds = new Set<string>();
  const emails = new Set<string>();
  rows.forEach(row => {
    if (row.profiles?.id) studentIds.add(row.profiles.id);
    if (row.profiles?.email) emails.add(row.profiles.email);
  });

  const [temperatures, studentNumbers] = await Promise.all([
    fetchTemperatureMap(Array.from(studentIds)),
    fetchStudentNumbers(emails),
  ]);

  return aggregateStatsBundle(rows, temperatures, studentNumbers);
};

/** 학생별 통계 조회 (번들에서 파생) */
export const getStudentStatistics = async (
  startDate: Date,
  endDate: Date,
  grade?: number | null,
  includeFuture: boolean = false,
  roomId?: string | null
): Promise<StudentStatistics[]> =>
  (await getStudentStatsBundle(startDate, endDate, grade, includeFuture, roomId)).statistics;

/** 학생별 일별 출석 현황 조회 (번들에서 파생) */
export const getStudentDailyAttendance = async (
  startDate: Date,
  endDate: Date,
  grade?: number | null,
  includeFuture: boolean = false,
  roomId?: string | null
): Promise<StudentDailyAttendance[]> =>
  (await getStudentStatsBundle(startDate, endDate, grade, includeFuture, roomId)).dailyAttendance;

/**
 * 교사 대시보드 통계 조회
 */
export const getDashboardStats = async (): Promise<DashboardStatistics> => {
  try {
    const today = startOfDay(new Date());
    const todayStr = format(today, 'yyyy-MM-dd');
    const startOfWeekStr = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'); // 월요일 시작
    const endOfWeekStr = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const { data, error } = await supabase.rpc('get_dashboard_statistics', {
      p_today: todayStr,
      p_week_start: startOfWeekStr,
      p_week_end: endOfWeekStr,
    });

    if (error) {
      console.error('Error fetching dashboard stats RPC:', error);
      throw error;
    }

    const result = data as any;

    return {
      todayApplicants: result.todayApplicants,
      todayApplicantsByGrade: result.todayApplicantsByGrade,
      weeklyApplicants: result.weeklyApplicants,
      weeklyApplicantsByGrade: result.weeklyApplicantsByGrade,
      averageAttendanceRate: result.averageAttendanceRate,
      attendanceRateByGrade: result.attendanceRateByGrade,
    };
  } catch (err) {
    console.error('getDashboardStats exception:', err);
    throw err;
  }
};

/**
 * 전교생 온도 랭킹 조회
 * (전체 데이터 기반, 상위 50명 등 필요에 따라 조정)
 */
export const getTemperatureRanking = async (): Promise<TemperatureRanking[]> => {
  try {
    const { data, error } = await supabase.rpc('get_temperature_ranking').returns<
      {
        rank: number;
        student_id: string;
        name: string;
        grade: number;
        class: number;
        temperature: number;
        monthly_change: number;
      }[]
    >();

    if (error) throw error;

    const rankingData = data as
      | {
          rank: number;
          student_id: string;
          name: string;
          grade: number;
          class: number;
          temperature: number;
          monthly_change: number;
        }[]
      | null;

    return (rankingData || []).map(item => ({
      rank: item.rank,
      studentId: item.student_id,
      name: item.name,
      grade: item.grade,
      class: item.class ? item.class.toString() : '',
      temperature: item.temperature,
      monthlyChange: item.monthly_change,
    }));
  } catch (err) {
    console.error('getTemperatureRanking error:', err);
    throw err;
  }
};

export interface MonthlyTemperatureRanking {
  rank: number;
  studentId: string;
  name: string;
  grade: number;
  class: string;
  monthlyChange: number;
  attendedDays: number;
}

/**
 * 월별 온도 랭킹 조회 — 해당 월에 쌓은 온도 변화량 기준 (공동 순위 허용)
 * @param month 조회할 달에 속한 아무 날짜
 */
export const getMonthlyTemperatureRanking = async (
  month: Date
): Promise<MonthlyTemperatureRanking[]> => {
  try {
    const { data, error } = await supabase.rpc('get_monthly_temperature_ranking', {
      p_month: format(month, 'yyyy-MM-01'),
    });

    if (error) throw error;

    return (data || []).map(item => ({
      rank: item.rank,
      studentId: item.student_id,
      name: item.name,
      grade: item.grade,
      class: item.class ? item.class.toString() : '',
      monthlyChange: Number(item.monthly_change),
      attendedDays: item.attended_days,
    }));
  } catch (err) {
    console.error('getMonthlyTemperatureRanking error:', err);
    throw err;
  }
};

/**
 * 온도 랭킹 새로고침 (Materialized View refresh)
 */
export const refreshTemperatureRanking = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc('refresh_temperature_rankings');
    if (error) throw error;
  } catch (err) {
    console.error('refreshTemperatureRanking error:', err);
    throw err;
  }
};

// ============================================================================
// CSV Import Functions
// ============================================================================

export interface AttendanceUpdateItem {
  studentNumber: string;
  name: string;
  date: string; // YYYY-MM-DD
  period: number; // 1, 2, 3, 4
  isAttended: boolean;
}

export interface AttendanceUpdateResult {
  success: number;
  failed: number;
  notFound: AttendanceUpdateItem[];
  errors: string[];
}

/**
 * CSV에서 파싱된 출석 데이터를 일괄 업데이트합니다.
 */
export const bulkUpdateAttendance = async (
  items: AttendanceUpdateItem[]
): Promise<AttendanceUpdateResult> => {
  const result: AttendanceUpdateResult = {
    success: 0,
    failed: 0,
    notFound: [],
    errors: [],
  };

  if (items.length === 0) return result;

  try {
    // ------------------------------------------------------------------
    // 1. 학번 → profile 매핑
    //    resource 에는 email 컬럼이 없다(예전 select('meta, email')은 항상 실패했다).
    //    학생 이메일 = `${meta.id}@myschool.hs.kr` → profiles.email → profiles.id
    //    CSV에서 온 값이므로 숫자만 남겨 PostgREST 필터 문법에 주입되지 않게 합니다.
    // ------------------------------------------------------------------
    const rawKeys = Array.from(new Set(items.map(item => item.studentNumber)));
    const exactIds = Array.from(
      new Set(rawKeys.map(exactStudentId).filter((v): v is string => !!v))
    );
    const fuzzyKeys = Array.from(
      new Set(
        rawKeys
          .filter(raw => !exactStudentId(raw))
          .map(digitsOnly)
          .filter(Boolean)
      )
    );

    if (exactIds.length === 0 && fuzzyKeys.length === 0) {
      result.errors.push('유효한 학번이 없습니다.');
      result.failed = items.length;
      return result;
    }

    // OR/IN 필터가 길어지면 URL 길이 제한에 걸리므로 나눠서 조회합니다.
    const CHUNK = 100;
    const metaIds = new Set<string>();
    const collect = (rows: any[] | null) =>
      (rows ?? []).forEach(r => {
        const id = r?.meta?.id;
        if (id) metaIds.add(String(id));
      });

    for (let i = 0; i < exactIds.length; i += CHUNK) {
      const { data, error } = await supabase
        .from('resource')
        .select('meta')
        .eq('type', 'student')
        .in('meta->>id', exactIds.slice(i, i + CHUNK));
      if (error) {
        result.errors.push(`리소스 조회 오류: ${error.message}`);
        return result;
      }
      collect(data as any[]);
    }
    for (let i = 0; i < fuzzyKeys.length; i += CHUNK) {
      const chunk = fuzzyKeys.slice(i, i + CHUNK);
      const { data, error } = await supabase
        .from('resource')
        .select('meta')
        .eq('type', 'student')
        .or(chunk.map(sn => `meta->>id.ilike.%${sn}%`).join(','));
      if (error) {
        result.errors.push(`리소스 조회 오류: ${error.message}`);
        return result;
      }
      collect(data as any[]);
    }

    const keyToMetaId = resolveStudentIds(rawKeys, Array.from(metaIds));
    const emails = Array.from(new Set(Array.from(keyToMetaId.values()).map(studentEmailOf)));

    let profiles: any[] = [];
    for (let i = 0; i < emails.length; i += CHUNK) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name')
        .in('email', emails.slice(i, i + CHUNK));

      if (error) {
        result.errors.push(`프로필 조회 오류: ${error.message}`);
        return result;
      }
      profiles.push(...((data as any[]) ?? []));
    }
    profiles = profiles.filter(Boolean);

    const emailToProfile = new Map<string, { id: string; name: string }>();
    profiles.forEach(p =>
      emailToProfile.set(String(p.email).toLowerCase(), { id: p.id, name: p.name })
    );

    // CSV 학번(원문) → profile
    const studentMap = new Map<string, { id: string; name: string }>();
    keyToMetaId.forEach((metaId, raw) => {
      const profile = emailToProfile.get(studentEmailOf(metaId).toLowerCase());
      if (profile) studentMap.set(raw, profile);
    });

    // ------------------------------------------------------------------
    // 2. 대상 예약을 한 번에 조회
    //    (이전에는 항목마다 SELECT + UPDATE를 순차 실행해 항목당 왕복 2회가 발생했습니다)
    // ------------------------------------------------------------------
    const targetIds = Array.from(new Set(Array.from(studentMap.values()).map(s => s.id)));
    const dates = Array.from(new Set(items.map(item => item.date))).sort();

    const reservationKey = (studentId: string, date: string, period: number) =>
      `${studentId}|${date}|${period}`;
    const reservationMap = new Map<string, { id: string; is_attended: boolean }>();

    const ID_CHUNK = 200;
    const PAGE_SIZE = 1000;

    for (let i = 0; i < targetIds.length && dates.length > 0; i += ID_CHUNK) {
      const chunk = targetIds.slice(i, i + ID_CHUNK);

      for (let page = 0; ; page++) {
        const { data, error } = await supabase
          .from('seat_reservations')
          .select('id, student_id, reservation_date, period_id, is_attended')
          .in('student_id', chunk)
          .gte('reservation_date', dates[0])
          .lte('reservation_date', dates[dates.length - 1])
          .order('id')
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
          .returns<any[]>();

        if (error) {
          result.errors.push(`예약 조회 오류: ${error.message}`);
          return result;
        }
        if (!data || data.length === 0) break;

        data.forEach(r => {
          reservationMap.set(reservationKey(r.student_id, r.reservation_date, r.period_id), {
            id: r.id,
            is_attended: r.is_attended,
          });
        });

        if (data.length < PAGE_SIZE) break;
      }
    }

    // ------------------------------------------------------------------
    // 3. 실제로 상태가 바뀌는 예약만 모읍니다.
    // ------------------------------------------------------------------
    const toAttended: string[] = [];
    const toAbsent: string[] = [];

    for (const item of items) {
      const student = studentMap.get(item.studentNumber);
      if (!student) {
        result.notFound.push(item);
        result.failed++;
        continue;
      }

      const reservation = reservationMap.get(reservationKey(student.id, item.date, item.period));
      if (!reservation) {
        result.notFound.push(item);
        result.failed++;
        continue;
      }

      if (reservation.is_attended !== item.isAttended) {
        (item.isAttended ? toAttended : toAbsent).push(reservation.id);
      }
      result.success++;
    }

    // ------------------------------------------------------------------
    // 4. 상태별로 묶어 일괄 업데이트 — 항목 수와 무관하게 요청 수가 일정합니다.
    // ------------------------------------------------------------------
    // 출석 보상(+5코인)은 attendance_status 를 본다 → 화면의 출석 체크와 같은 네 칸을 함께 쓴다
    const { data: sessionData } = await supabase.auth.getSession();
    const checkerId = sessionData.session?.user.id ?? null;

    const applyUpdate = async (ids: string[], isAttended: boolean) => {
      const UPDATE_CHUNK = 200;
      for (let i = 0; i < ids.length; i += UPDATE_CHUNK) {
        const chunk = ids.slice(i, i + UPDATE_CHUNK);
        const { error } = await supabase
          .from('seat_reservations')
          .update({
            is_attended: isAttended,
            attendance_status: isAttended ? 'attended' : null,
            attended_at: isAttended ? new Date().toISOString() : null,
            checked_by: isAttended ? checkerId : null,
          } as any)
          .in('id', chunk);

        if (error) {
          result.errors.push(`출석 업데이트 오류 (${chunk.length}건): ${error.message}`);
          result.success = Math.max(0, result.success - chunk.length);
          result.failed += chunk.length;
        }
      }
    };

    await applyUpdate(Array.from(new Set(toAttended)), true);
    await applyUpdate(Array.from(new Set(toAbsent)), false);

    // 화면이 방금 바뀐 출석을 바로 반영하도록 캐시를 비웁니다.
    if (result.success > 0) invalidateStudentStatsBundleCache();

    return result;
  } catch (err) {
    result.errors.push(
      `일괄 업데이트 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`
    );
    return result;
  }
};

/**
 * CSV 문자열을 파싱하여 출석 업데이트 항목으로 변환합니다.
 * CSV 형식: 학번,이름,MM/dd 1,MM/dd 2,MM/dd 3,MM/dd 4,...
 * 값: 1(출석), 0(비출석)
 */
export const parseAttendanceCSV = (
  csvContent: string,
  year: number = new Date().getFullYear()
): { items: AttendanceUpdateItem[]; errors: string[] } => {
  const items: AttendanceUpdateItem[] = [];
  const errors: string[] = [];

  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    errors.push('CSV 파일에 데이터가 없습니다.');
    return { items, errors };
  }

  // 헤더 파싱
  const header = lines[0].split(',').map(h => h.trim());
  if (header.length < 3) {
    errors.push('CSV 헤더 형식이 올바르지 않습니다.');
    return { items, errors };
  }

  // 헤더에서 날짜/교시 정보 추출 (예: "01/05 1" -> { date: "01/05", period: 1 })
  const dateColumns: { index: number; date: string; period: number }[] = [];
  for (let i = 2; i < header.length; i++) {
    const match = header[i].match(/^(\d{1,2}\/\d{1,2})\s*(\d)$/);
    if (match) {
      dateColumns.push({
        index: i,
        date: match[1],
        period: parseInt(match[2], 10),
      });
    }
  }

  if (dateColumns.length === 0) {
    errors.push('CSV 헤더에서 날짜/교시 정보를 찾을 수 없습니다.');
    return { items, errors };
  }

  // 데이터 행 파싱
  for (let rowIdx = 1; rowIdx < lines.length; rowIdx++) {
    const line = lines[rowIdx].trim();
    if (!line) continue;

    const cols = line.split(',').map(c => c.trim());
    if (cols.length < 3) {
      errors.push(`${rowIdx + 1}번째 행: 데이터가 부족합니다.`);
      continue;
    }

    const studentNumber = cols[0];
    const name = cols[1];

    if (!studentNumber) {
      errors.push(`${rowIdx + 1}번째 행: 학번이 비어있습니다.`);
      continue;
    }

    // 각 날짜/교시별 출석 상태 파싱
    for (const dc of dateColumns) {
      const value = cols[dc.index];
      if (value === undefined || value === '') continue;

      const isAttended =
        value === '1' || value.toLowerCase() === 'true' || value === 'O' || value === 'o';

      // MM/dd를 YYYY-MM-DD로 변환
      const [month, day] = dc.date.split('/').map(Number);
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      items.push({
        studentNumber,
        name,
        date: dateStr,
        period: dc.period,
        isAttended,
      });
    }
  }

  return { items, errors };
};
