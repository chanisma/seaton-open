import { supabase } from '@/lib/supabase';
import type {
  PuzzleEvent,
  PuzzlePiece,
  PuzzleEventWithProgress,
  PuzzleEventStatus,
  PuzzleGridSize,
  StudentPuzzleCollection,
  StudentPuzzleProgress,
  UnlockPieceResult,
} from '@project-types/puzzle.types';
import type { CollectionOwner } from '@project-types/ownership.types';
import type { UserType } from '@project-types/user.types';
import { splitImageFile, parseGridSize } from '@utils/puzzleImageSplitter';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

interface PuzzleOwnershipRow {
  event_id: string;
  completed_at: string;
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

// ─── 퍼즐 이벤트 조회 ───

/**
 * 모든 퍼즐 이벤트 조회 (관리자용)
 */
export const getAllPuzzleEvents = async (): Promise<PuzzleEvent[]> => {
  const { data, error } = await db
    .from('puzzle_events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching puzzle events:', error);
    return [];
  }
  return (data as PuzzleEvent[]) || [];
};

/**
 * 활성 퍼즐 이벤트 조회 (학생용)
 */
export const getActivePuzzleEvents = async (): Promise<PuzzleEvent[]> => {
  const { data, error } = await db
    .from('puzzle_events')
    .select('*')
    .eq('is_active', true)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('Error fetching active puzzle events:', error);
    return [];
  }
  return (data as PuzzleEvent[]) || [];
};

/**
 * 퍼즐 이벤트 상세 조회
 */
export const getPuzzleEvent = async (eventId: string): Promise<PuzzleEvent | null> => {
  const { data, error } = await db.from('puzzle_events').select('*').eq('id', eventId).single();

  if (error) {
    console.error('Error fetching puzzle event:', error);
    return null;
  }
  return data as PuzzleEvent;
};

/**
 * 퍼즐 이벤트의 조각 목록 조회
 */
export const getPuzzlePieces = async (eventId: string): Promise<PuzzlePiece[]> => {
  const { data, error } = await db
    .from('puzzle_pieces')
    .select('*')
    .eq('event_id', eventId)
    .order('piece_index', { ascending: true });

  if (error) {
    console.error('Error fetching puzzle pieces:', error);
    return [];
  }
  return (data as PuzzlePiece[]) || [];
};

// ─── 학생 진행도 ───

/**
 * 학생의 특정 이벤트 퍼즐 진행도 조회
 */
export const getStudentProgress = async (
  studentId: string,
  eventId: string
): Promise<StudentPuzzleProgress[]> => {
  const { data, error } = await db
    .from('student_puzzle_progress')
    .select('*')
    .eq('student_id', studentId)
    .eq('event_id', eventId)
    .order('piece_index', { ascending: true });

  if (error) {
    console.error('Error fetching student progress:', error);
    return [];
  }
  return (data as StudentPuzzleProgress[]) || [];
};

/**
 * 학생의 모든 퍼즐 진행도 조회
 */
export const getStudentAllProgress = async (
  studentId: string
): Promise<StudentPuzzleProgress[]> => {
  const { data, error } = await db
    .from('student_puzzle_progress')
    .select('*')
    .eq('student_id', studentId);

  if (error) {
    console.error('Error fetching all student progress:', error);
    return [];
  }
  return (data as StudentPuzzleProgress[]) || [];
};

/**
 * 학생의 퍼즐 컬렉션 조회
 */
export const getStudentCollection = async (
  studentId: string
): Promise<StudentPuzzleCollection[]> => {
  const { data, error } = await db
    .from('student_puzzle_collection')
    .select('*')
    .eq('student_id', studentId)
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching student collection:', error);
    return [];
  }
  return (data as StudentPuzzleCollection[]) || [];
};

/**
 * 이벤트 상태 계산
 */
export function getEventStatus(event: PuzzleEvent): PuzzleEventStatus {
  const today = new Date().toISOString().split('T')[0];
  if (today < event.start_date) return 'upcoming';
  if (today > event.end_date) return 'ended';
  return 'active';
}

/**
 * 학생 시점의 퍼즐 이벤트 목록 (진행도 포함)
 */
export const getPuzzleEventsWithProgress = async (
  studentId: string
): Promise<PuzzleEventWithProgress[]> => {
  const [events, allProgress, collection] = await Promise.all([
    getActivePuzzleEvents(),
    getStudentAllProgress(studentId),
    getStudentCollection(studentId),
  ]);

  const collectedEventIds = new Set(collection.map(c => c.event_id));

  return events
    .map(event => {
      const eventProgress = allProgress.filter(p => p.event_id === event.id);
      const unlockedPieces = eventProgress.map(p => p.piece_index);
      const isCompleted = unlockedPieces.length >= event.total_pieces;
      const isCollected = collectedEventIds.has(event.id);
      const status = getEventStatus(event);

      return {
        ...event,
        unlocked_pieces: unlockedPieces,
        is_completed: isCompleted,
        is_collected: isCollected,
        status,
      };
    })
    .sort((a, b) => b.start_date.localeCompare(a.start_date));
};

// ─── 퍼즐 조각 오픈 ───

/**
 * 퍼즐 조각 오픈 (포인트 차감 + 진행도 기록)
 * 이벤트 상태·중복 오픈·포인트 잔액·관리자 여부는 전부 unlock_puzzle_piece RPC가
 * 하나의 트랜잭션 안에서 서버측으로 재검증한다 (클라이언트 입력은 신뢰하지 않음).
 */
export const unlockPuzzlePiece = async (
  eventId: string,
  pieceIndex: number
): Promise<UnlockPieceResult> => {
  const { data, error } = await db.rpc('unlock_puzzle_piece', {
    p_event_id: eventId,
    p_piece_index: pieceIndex,
  });

  if (error) {
    console.error('Error unlocking puzzle piece:', error);
    throw new Error(error.message || '퍼즐 조각 오픈에 실패했습니다.');
  }

  const row = Array.isArray(data) ? data[0] : data;

  return {
    success: true,
    piece_index: row.piece_index,
    remaining_points: row.remaining_points,
    is_puzzle_completed: row.is_puzzle_completed,
  };
};

/**
 * 이벤트별 퍼즐 소유(완성) 학생 수 조회
 */
export const getPuzzleOwnerCounts = async (): Promise<Record<string, number>> => {
  const { data, error } = await db.from('student_puzzle_collection').select('event_id');

  if (error) {
    console.error('Error fetching puzzle owner counts:', error);
    return {};
  }

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.event_id] = (counts[row.event_id] || 0) + 1;
  }
  return counts;
};

/**
 * 관리자용: 이벤트별 퍼즐 소유 사용자 목록 조회
 */
export const getPuzzleOwnershipByEvent = async (): Promise<Record<string, CollectionOwner[]>> => {
  const { data, error } = await db
    .from('student_puzzle_collection')
    .select(
      `
        event_id,
        completed_at,
        profiles!student_puzzle_collection_student_id_fkey (
          id,
          name,
          email,
          role
        )
      `
    )
    .order('completed_at', { ascending: false });

  if (error) {
    console.error('Error fetching puzzle ownership:', error);
    throw new Error('퍼즐 소유 현황을 불러오지 못했습니다.');
  }

  const ownership: Record<string, CollectionOwner[]> = {};

  for (const row of (data ?? []) as PuzzleOwnershipRow[]) {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    if (!profile) continue;

    const owner: CollectionOwner = {
      id: profile.id,
      name: profile.name || profile.email || '이름 없음',
      email: profile.email || '',
      role: profile.role,
      ownedAt: row.completed_at,
    };

    ownership[row.event_id] = [...(ownership[row.event_id] ?? []), owner];
  }

  return ownership;
};

// ─── 관리자 기능 ───

/**
 * 퍼즐 이벤트 생성 (이미지 업로드 + 조각 분할 포함)
 */
export const createPuzzleEvent = async (params: {
  title: string;
  description: string;
  imageFile: File;
  gridSize: PuzzleGridSize;
  pieceCost: number;
  startDate: string;
  endDate: string;
}): Promise<PuzzleEvent> => {
  const { title, description, imageFile, gridSize, pieceCost, startDate, endDate } = params;
  const { rows, cols } = parseGridSize(gridSize);
  const totalPieces = rows * cols;

  // 1. 원본 이미지 업로드
  const timestamp = Date.now();
  const ext = imageFile.name.split('.').pop() || 'jpg';
  const originalPath = `originals/${timestamp}_original.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('puzzle-images')
    .upload(originalPath, imageFile, { contentType: imageFile.type });

  if (uploadError) {
    console.error('Error uploading original image:', uploadError);
    throw new Error('원본 이미지 업로드에 실패했습니다.');
  }

  const { data: urlData } = supabase.storage.from('puzzle-images').getPublicUrl(originalPath);
  const imageUrl = urlData.publicUrl;

  // 2. 이벤트 레코드 생성
  const { data: event, error: eventError } = await db
    .from('puzzle_events')
    .insert({
      title,
      description,
      image_url: imageUrl,
      grid_size: gridSize,
      total_pieces: totalPieces,
      piece_cost: pieceCost,
      start_date: startDate,
      end_date: endDate,
    })
    .select()
    .single();

  if (eventError || !event) {
    console.error('Error creating puzzle event:', eventError);
    throw new Error('퍼즐 이벤트 생성에 실패했습니다.');
  }

  // 3. 이미지 분할
  const splitResult = await splitImageFile(imageFile, gridSize);

  // 4. 각 조각 업로드 및 DB 기록
  const pieceRecords: { event_id: string; piece_index: number; image_url: string }[] = [];

  for (let i = 0; i < splitResult.pieces.length; i++) {
    const piecePath = `pieces/${event.id}/piece_${i}.webp`;

    const { error: pieceUploadError } = await supabase.storage
      .from('puzzle-images')
      .upload(piecePath, splitResult.pieces[i], { contentType: 'image/webp' });

    if (pieceUploadError) {
      console.error(`Error uploading piece ${i}:`, pieceUploadError);
      throw new Error(`퍼즐 조각 #${i + 1} 업로드에 실패했습니다.`);
    }

    const { data: pieceUrlData } = supabase.storage.from('puzzle-images').getPublicUrl(piecePath);

    pieceRecords.push({
      event_id: event.id,
      piece_index: i,
      image_url: pieceUrlData.publicUrl,
    });
  }

  // 5. 모든 조각 레코드 일괄 삽입
  const { error: piecesError } = await db.from('puzzle_pieces').insert(pieceRecords);

  if (piecesError) {
    console.error('Error inserting puzzle pieces:', piecesError);
    throw new Error('퍼즐 조각 정보 저장에 실패했습니다.');
  }

  return event as PuzzleEvent;
};

/**
 * 퍼즐 이벤트 수정 (이미지 제외)
 */
export const updatePuzzleEvent = async (
  eventId: string,
  updates: Partial<
    Pick<
      PuzzleEvent,
      'title' | 'description' | 'piece_cost' | 'start_date' | 'end_date' | 'is_active'
    >
  >
): Promise<PuzzleEvent> => {
  const { data, error } = await db
    .from('puzzle_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Error updating puzzle event:', error);
    throw new Error('퍼즐 이벤트 수정에 실패했습니다.');
  }
  return data as PuzzleEvent;
};

/**
 * 퍼즐 이벤트 삭제 (CASCADE로 조각, 진행도도 함께 삭제)
 */
export const deletePuzzleEvent = async (eventId: string): Promise<void> => {
  // Storage에서 조각 이미지 삭제
  const { data: files } = await supabase.storage.from('puzzle-images').list(`pieces/${eventId}`);
  if (files && files.length > 0) {
    const paths = files.map(f => `pieces/${eventId}/${f.name}`);
    await supabase.storage.from('puzzle-images').remove(paths);
  }

  // DB 레코드 삭제 (CASCADE)
  const { error } = await db.from('puzzle_events').delete().eq('id', eventId);
  if (error) {
    console.error('Error deleting puzzle event:', error);
    throw new Error('퍼즐 이벤트 삭제에 실패했습니다.');
  }
};
