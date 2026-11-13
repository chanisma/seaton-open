export type UserType = 'student' | 'teacher' | 'admin';

export interface UserMeta {
  id?: string; // 학번 (예: "00-00463")
  grade?: number; // 학년 (1, 2, 3)
  class?: number; // 반
  snum1?: string; // 학번 숫자 부분 (예: "10117")
  number?: number; // 번호
  picture?: string; // 프로필 사진 URL
  birthday?: string; // 생년월일
  phone?: string; // 전화번호
}

export interface Resource {
  id: string;
  type: UserType;
  email: string;
  name: string;
  meta: UserMeta;
  created_at: string;
}

// Profiles 테이블 타입
export interface Profile {
  id: string; // auth.users.id
  email: string;
  role: UserType; // 'student' | 'teacher'
  last_login: string;
  created_at: string;
  updated_at: string;
  name?: string; // 이름
  // resource.meta에서 enrichment로 채워지는 필드 (DB 컬럼 아님)
  grade?: number;
  class?: number;
  student_number?: string;
}

// User 타입 (student와 teacher 모두 지원)
export interface User {
  // Profile 정보 (필수)
  profile_id: string; // profiles.id
  email: string;
  type: UserType; // role
  last_login: string;

  // Resource 정보 (student만 필수, teacher는 선택적)
  id?: string; // resource.id (student만)
  name?: string; // resource.name (student만)
  meta?: UserMeta; // resource.meta (student만)
  created_at?: string; // resource.created_at (student만)
}
