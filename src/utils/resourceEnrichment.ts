import { supabase } from '@/lib/supabase';

/**
 * 예약 데이터에 resource.meta 정보(grade, class, student_number) 병합
 * profiles join 결과에 resource.meta 데이터를 추가하여 기존과 동일한 데이터 형태 유지
 */
export const enrichWithResourceMeta = async <T extends Record<string, any>>(
  data: T[]
): Promise<T[]> => {
  if (!data || data.length === 0) return data;

  // profiles.email에서 고유 이메일 수집
  const emailSet = new Set<string>();
  data.forEach(item => {
    const email = item.profiles?.email;
    if (email) emailSet.add(email);
  });

  if (emailSet.size === 0) return data;

  // 이메일에서 학번 추출하여 resource 조회
  const studentIds = Array.from(emailSet)
    .map(email => email.split('@')[0])
    .filter(id => /^[\d-]+$/.test(id)); // 학번 형식 (숫자+하이픈, 예: 00-00472)

  if (studentIds.length === 0) return data;

  // resource.meta.id로 일괄 조회
  // name도 함께 가져온다: profiles.name이 NULL인 계정의 폴백으로 쓰인다
  // (이름은 meta가 아니라 resource.name 컬럼에 있다)
  const { data: resources, error } = await supabase
    .from('resource')
    .select('id, name, meta')
    .in('meta->>id', studentIds);

  if (error || !resources) {
    console.error('Error fetching resources for enrichment:', error);
    return data;
  }

  // meta.id -> { name, meta } 매핑 생성 (meta.id@myschool.hs.kr 형태로 키 생성)
  const metaByEmail = new Map<string, { name: string | null; meta: any }>();
  resources.forEach((r: any) => {
    if (r.meta?.id) {
      const emailKey = `${r.meta.id}@myschool.hs.kr`;
      metaByEmail.set(emailKey, { name: r.name ?? null, meta: r.meta });
    }
  });

  // 데이터에 grade, class, student_number 병합
  return data.map(item => {
    const profile = item.profiles;
    if (!profile?.email) return item;

    const entry = metaByEmail.get(profile.email);
    if (!entry) return item;

    const { name: resourceName, meta } = entry;

    return {
      ...item,
      profiles: {
        ...profile,
        // profiles.name이 비어 있으면 resource.name으로 대체 (UI에 이름이 안 뜨는 문제 방지)
        name: profile.name || resourceName || null,
        grade: meta.grade ?? null,
        class: meta.class ?? null,
        student_number: meta.id ?? null,
        number: meta.number ?? null, // 반 내 번호 (GCCNN 학번 구성용)
      },
    };
  });
};

/**
 * 특정 학년의 학생 profile ID 목록 반환
 * statistics에서 grade 필터 대체용
 */
export const getStudentIdsByGrade = async (grade: number): Promise<string[]> => {
  // resource에서 해당 학년 학생 이메일 목록 조회
  const { data: resources, error } = await supabase
    .from('resource')
    .select('meta')
    .eq('meta->>grade', String(grade));

  if (error || !resources) {
    console.error('Error fetching resources by grade:', error);
    return [];
  }

  // 학번으로 이메일 생성 후 profiles에서 ID 조회
  const studentEmails = resources
    .map((r: any) => (r.meta?.id ? `${r.meta.id}@myschool.hs.kr` : null))
    .filter(Boolean) as string[];

  if (studentEmails.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .in('email', studentEmails);

  if (profileError || !profiles) {
    console.error('Error fetching profiles by grade:', profileError);
    return [];
  }

  return profiles.map((p: any) => p.id);
};

/**
 * 재학생 이메일 -> 학년 매핑 ({meta.id}@myschool.hs.kr -> meta.grade)
 * 예약 행의 profiles.email로 학년을 판정할 때 사용한다.
 * getStudentIdsByGrade와 달리 profiles.id 목록을 .in()으로 넘기지 않으므로
 * 여러 학년을 골라도 URL 길이 제한에 걸리지 않는다.
 */
export const getStudentGradeByEmail = async (): Promise<Map<string, number>> => {
  const PAGE_SIZE = 1000;
  const map = new Map<string, number>();
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('resource')
      .select('id, sid:meta->>id, grade:meta->>grade')
      .in('meta->>grade', ['1', '2', '3'])
      .order('id')
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching student grades:', error);
      throw new Error('학생 학년 정보를 불러오는데 실패했습니다.');
    }
    if (!data || data.length === 0) break;

    data.forEach((r: any) => {
      const grade = Number(r.grade);
      if (r.sid && grade) map.set(`${r.sid}@myschool.hs.kr`, grade);
    });

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return map;
};

/**
 * 학번(resource.meta.id)으로 학생 검색하여 profile ID 반환
 * admin 검색 기능에서 profiles.student_number 대체용
 */
export const searchStudentByNumber = async (query: string): Promise<string[]> => {
  // resource.meta.id에서 검색
  const { data: resources, error } = await supabase
    .from('resource')
    .select('meta')
    .ilike('meta->>id', `%${query}%`);

  if (error || !resources) {
    console.error('Error searching students by number:', error);
    return [];
  }

  const studentEmails = resources
    .map((r: any) => (r.meta?.id ? `${r.meta.id}@myschool.hs.kr` : null))
    .filter(Boolean) as string[];

  if (studentEmails.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .in('email', studentEmails);

  if (profileError || !profiles) {
    console.error('Error fetching profiles for student search:', profileError);
    return [];
  }

  return profiles.map((p: any) => p.id);
};
