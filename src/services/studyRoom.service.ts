import { supabase } from '@/lib/supabase';
import type { StudyRoom, SeatLayout } from '@project-types/reservation.types';

/**
 * 열람실 관련 서비스
 */

// ============================================================================
// Constants & Helpers
// ============================================================================

/**
 * 기본 좌석 배치 레이아웃 (좌석 정보가 없을 때 사용)
 */
const DEFAULT_SEAT_LAYOUT: SeatLayout = {
  totalRows: 0,
  totalColumns: 0,
  sections: [],
  emptySeats: [],
  unavailableSeats: [],
};

/**
 * DB에서 조회한 열람실 데이터를 StudyRoom 타입으로 변환
 */
function parseStudyRoomData(room: any): StudyRoom {
  return {
    ...room,
    seat_layout: (room.seat_layout as unknown as SeatLayout) || DEFAULT_SEAT_LAYOUT,
  } as StudyRoom;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * 모든 열람실 조회
 */
export const getAllStudyRooms = async (includeInactive = false): Promise<StudyRoom[]> => {
  let query = supabase.from('study_rooms').select('*').order('name', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch study rooms:', error);
    throw error;
  }

  return (data || []).map(parseStudyRoomData);
};

/**
 * 특정 학년의 열람실 조회 (각 학년마다 하나의 열람실만 존재)
 */
export const getStudyRoomByGrade = async (grade: number): Promise<StudyRoom | null> => {
  const { data, error } = await supabase
    .from('study_rooms')
    .select('*')
    .eq('grade', grade)
    .eq('is_active', true)
    .single();

  if (error) {
    // Not found는 null 반환
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error(`Failed to fetch study room for grade ${grade}:`, error);
    throw error;
  }

  return data ? parseStudyRoomData(data) : null;
};

/**
 * 특정 열람실 조회
 */
export const getStudyRoomById = async (roomId: string): Promise<StudyRoom | null> => {
  const { data, error } = await supabase.from('study_rooms').select('*').eq('id', roomId).single();

  if (error) {
    console.error(`Failed to fetch study room ${roomId}:`, error);
    throw error;
  }

  return data ? parseStudyRoomData(data) : null;
};

/**
 * 샘플 열람실 데이터 생성 (개발용)
 */
export const createSampleStudyRooms = async (): Promise<void> => {
  const sampleRooms = [
    {
      name: '1학년 열람실',
      grade: 1,
      total_seats: 30,
      seat_layout: {
        totalRows: 6,
        totalColumns: 5,
        sections: [
          {
            rows: 6,
            columns: 5,
            startRow: 0,
            startCol: 0,
          },
        ],
        emptySeats: [],
      } as SeatLayout,
      is_active: true,
    },
    {
      name: '2학년 열람실',
      grade: 2,
      total_seats: 35,
      seat_layout: {
        totalRows: 7,
        totalColumns: 5,
        sections: [
          {
            rows: 7,
            columns: 5,
            startRow: 0,
            startCol: 0,
          },
        ],
        emptySeats: [],
      } as SeatLayout,
      is_active: true,
    },
    {
      name: '3학년 열람실',
      grade: 3,
      total_seats: 40,
      seat_layout: {
        totalRows: 8,
        totalColumns: 5,
        sections: [
          {
            rows: 8,
            columns: 5,
            startRow: 0,
            startCol: 0,
          },
        ],
        emptySeats: [],
      } as SeatLayout,
      is_active: true,
    },
  ];

  const { error } = await supabase.from('study_rooms').insert(sampleRooms as any);

  if (error) {
    console.error('Failed to create sample study rooms:', error);
    throw error;
  }

  console.log('Sample study rooms created successfully');
};

/**
 * 열람실 생성
 */
export const createStudyRoom = async (
  name: string,
  grade: number,
  totalSeats: number,
  seatLayout: SeatLayout
): Promise<StudyRoom> => {
  const { data, error } = await supabase
    .from('study_rooms')
    .insert({
      name,
      grade,
      total_seats: totalSeats,
      seat_layout: seatLayout as unknown as any,
      is_active: true,
    } as any)
    .select()
    .single();

  if (error) {
    console.error('Failed to create study room:', error);
    throw error;
  }

  return parseStudyRoomData(data);
};

/**
 * 열람실 활성화/비활성화
 */
export const toggleStudyRoomStatus = async (roomId: string, isActive: boolean): Promise<void> => {
  const { error } = await supabase
    .from('study_rooms')
    .update({ is_active: isActive } as unknown as never)
    .eq('id', roomId);

  if (error) {
    console.error('Failed to update study room status:', error);
    throw error;
  }
};

/**
 * 열람실 정보 수정
 */
export const updateStudyRoom = async (
  roomId: string,
  updates: Partial<Omit<StudyRoom, 'id' | 'created_at'>>
): Promise<StudyRoom> => {
  const { data, error } = await supabase
    .from('study_rooms')
    .update(updates as unknown as never)
    .eq('id', roomId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update study room:', error);
    throw error;
  }

  return parseStudyRoomData(data);
};

/**
 * 열람실 삭제 (실제로는 비활성화)
 */
export const deleteStudyRoom = async (roomId: string): Promise<void> => {
  await toggleStudyRoomStatus(roomId, false);
};

/**
 * 열람실 복제
 */
export const copyStudyRoom = async (roomId: string): Promise<StudyRoom> => {
  // 1. 원본 열람실 정보 조회
  const { data: sourceRoom, error: fetchError } = await supabase
    .from('study_rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (fetchError || !sourceRoom) {
    console.error('Failed to fetch source room for copy:', fetchError);
    throw fetchError || new Error('Source room not found');
  }

  const sourceRoomData = sourceRoom as unknown as StudyRoom;

  // 2. 새 열람실 데이터 준비 (이름 변경, 비활성화)
  const { id, created_at, ...roomData } = sourceRoomData;
  const newRoomData = {
    ...roomData,
    name: `Copy of ${sourceRoomData.name}`,
    is_active: false, // 복제된 열람실은 기본적으로 비활성 상태
  };

  // 3. 새 열람실 생성
  const { data: newRoom, error: createError } = await supabase
    .from('study_rooms')
    .insert(newRoomData as any)
    .select()
    .single();

  if (createError) {
    console.error('Failed to create copied room:', createError);
    throw createError;
  }

  return parseStudyRoomData(newRoom);
};
