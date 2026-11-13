import { supabase } from '@/lib/supabase';
import type { Badge, BadgeAcquire } from '@project-types/badge.types';
import type { CollectionOwner } from '@project-types/ownership.types';
import type { UserType } from '@project-types/user.types';

// supabase.types.ts에 seaton_badge/seaton_badge_acquire 타입이 아직 없으므로 any 캐스트 사용
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface BadgeOwnershipRow {
  badge_id: number;
  acquired_at: string;
  profiles:
    | {
        id: string;
        name: string | null;
        email: string | null;
        role: UserType;
      }
    | {
        id: string;
        name: string | null;
        email: string | null;
        role: UserType;
      }[]
    | null;
}

/**
 * 모든 뱃지 정의 조회 (온도 오름차순)
 */
export const getAllBadges = async (): Promise<Badge[]> => {
  const { data, error } = await db
    .from('seaton_badge')
    .select('*')
    .order('temperature', { ascending: true });

  if (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
  return (data as Badge[]) || [];
};

/**
 * 학생이 획득한 뱃지 목록 조회
 */
export const getAcquiredBadges = async (studentId: string): Promise<BadgeAcquire[]> => {
  const { data, error } = await db
    .from('seaton_badge_acquire')
    .select('*')
    .eq('student_id', studentId);

  if (error) {
    console.error('Error fetching acquired badges:', error);
    return [];
  }
  return (data as BadgeAcquire[]) || [];
};

/**
 * 관리자용: 뱃지별 소유 사용자 목록 조회
 */
export const getBadgeOwnershipByBadge = async (): Promise<Record<number, CollectionOwner[]>> => {
  const { data, error } = await db
    .from('seaton_badge_acquire')
    .select(
      `
        badge_id,
        acquired_at,
        profiles!seaton_badge_acquire_student_id_fkey (
          id,
          name,
          email,
          role
        )
      `
    )
    .order('acquired_at', { ascending: false });

  if (error) {
    console.error('Error fetching badge ownership:', error);
    throw new Error('뱃지 소유 현황을 불러오지 못했습니다.');
  }

  const ownership: Record<number, CollectionOwner[]> = {};

  for (const row of (data ?? []) as BadgeOwnershipRow[]) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    if (!profile) continue;

    const owner: CollectionOwner = {
      id: profile.id,
      name: profile.name || profile.email || '이름 없음',
      email: profile.email || '',
      role: profile.role,
      ownedAt: row.acquired_at,
    };

    ownership[row.badge_id] = [...(ownership[row.badge_id] ?? []), owner];
  }

  return ownership;
};

/**
 * 뱃지 획득 (상자 열기)
 * 온도 조건 충족 여부는 서버(acquire_badge RPC)에서 재검증한다.
 */
export const acquireBadge = async (badgeId: number): Promise<BadgeAcquire | null> => {
  const { data, error } = await db.rpc('acquire_badge', { p_badge_id: badgeId });

  if (error) {
    console.error('Error acquiring badge:', error);
    throw new Error(error.message?.includes('온도') ? error.message : '뱃지 획득에 실패했습니다.');
  }
  return data as BadgeAcquire;
};

/**
 * 대시보드에 표시할 뱃지 선택
 */
export const selectBadge = async (studentId: string, badgeId: number): Promise<void> => {
  const { error } = await db
    .from('profiles')
    .update({ selected_badge_id: badgeId })
    .eq('id', studentId);

  if (error) {
    console.error('Error selecting badge:', error);
    throw new Error('뱃지 선택에 실패했습니다.');
  }
};

/**
 * 선택된 뱃지 ID 조회
 */
export const getSelectedBadgeId = async (studentId: string): Promise<number | null> => {
  const { data, error } = await db
    .from('profiles')
    .select('selected_badge_id')
    .eq('id', studentId)
    .single();

  if (error) {
    console.error('Error fetching selected badge:', error);
    return null;
  }
  return data?.selected_badge_id ?? null;
};

/**
 * 대시보드용: 표시할 뱃지 조회 (선택된 뱃지 또는 가장 최근 획득 뱃지)
 */
export const getDisplayBadge = async (studentId: string): Promise<Badge | null> => {
  // 1. 선택된 뱃지 확인
  const selectedId = await getSelectedBadgeId(studentId);

  if (selectedId) {
    const { data } = await db.from('seaton_badge').select('*').eq('id', selectedId).single();
    if (data) return data as Badge;
  }

  // 2. 선택 없으면 가장 최근 획득 뱃지
  const { data: latestAcquire } = await db
    .from('seaton_badge_acquire')
    .select('badge_id')
    .eq('student_id', studentId)
    .order('acquired_at', { ascending: false })
    .limit(1)
    .single();

  if (!latestAcquire) return null;

  const { data: badge } = await db
    .from('seaton_badge')
    .select('*')
    .eq('id', latestAcquire.badge_id)
    .single();

  return (badge as Badge) || null;
};
