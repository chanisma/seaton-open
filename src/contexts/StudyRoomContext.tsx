import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
  useCallback,
} from 'react';
import type { StudyRoom } from '@/types/reservation.types';
import { getAllStudyRooms } from '@services/studyRoom.service';

interface StudyRoomContextType {
  studyRooms: StudyRoom[];
  allStudyRooms: StudyRoom[]; // For Admin
  isLoading: boolean;
  error: Error | null;
  refreshStudyRooms: () => Promise<void>;
  getStudyRoomById: (id: string) => StudyRoom | undefined;
  getStudyRoomByGrade: (grade: number) => StudyRoom | undefined;
}

const StudyRoomContext = createContext<StudyRoomContextType | null>(null);

export const StudyRoomProvider = ({ children }: { children: ReactNode }) => {
  const [allStudyRooms, setAllStudyRooms] = useState<StudyRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const sortedAllStudyRooms = useMemo(
    () => [...allStudyRooms].sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [allStudyRooms]
  );

  const studyRooms = useMemo(
    () => sortedAllStudyRooms.filter(room => room.is_active),
    [sortedAllStudyRooms]
  );

  const fetchRooms = useCallback(async () => {
    // 인증된 사용자만 열람실 정보를 가져오도록 함 (선택 사항, 공개라면 user check 제거 가능)
    // 여기서는 앱 로직상 로그인 후 사용하는 경우가 많으므로 유지하되,
    // 공개 페이지에서도 필요하다면 user check를 뺄 수 있음.
    // 현재 구조상 AuthProvider 내부에서 실행되므로 user가 로드된 후 실행하는 것이 안전할 수 있음.
    try {
      setIsLoading(true);
      const rooms = await getAllStudyRooms(true); // Fetch all rooms including inactive
      setAllStudyRooms(rooms);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch study rooms'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const getStudyRoomById = useCallback(
    (id: string) => {
      return allStudyRooms.find(room => room.id === id);
    },
    [allStudyRooms]
  );

  const getStudyRoomByGrade = useCallback(
    (grade: number) => {
      return studyRooms.find(room => room.grades?.includes(grade) || room.grade === grade);
    },
    [studyRooms]
  );

  return (
    <StudyRoomContext.Provider
      value={{
        studyRooms,
        allStudyRooms: sortedAllStudyRooms,
        isLoading,
        error,
        refreshStudyRooms: fetchRooms,
        getStudyRoomById,
        getStudyRoomByGrade,
      }}
    >
      {children}
    </StudyRoomContext.Provider>
  );
};

export const useStudyRooms = () => {
  const context = useContext(StudyRoomContext);
  if (!context) {
    throw new Error('useStudyRooms must be used within a StudyRoomProvider');
  }
  return context;
};
