import { useState } from 'react';
import { Image, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { PuzzleEvent, StudentPuzzleCollection } from '@project-types/puzzle.types';

interface PuzzleCollectionProps {
  collection: StudentPuzzleCollection[];
  events: PuzzleEvent[];
}

interface ViewingItem {
  event: PuzzleEvent;
  completedAt: string;
}

export const PuzzleCollection = ({ collection, events }: PuzzleCollectionProps) => {
  const [viewing, setViewing] = useState<ViewingItem | null>(null);

  if (collection.length === 0) {
    return (
      <div className="content-surface flex flex-col items-center rounded-[2rem] px-5 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Image className="h-6 w-6" />
        </span>
        <p className="mt-4 text-sm font-semibold text-foreground">아직 소장한 퍼즐이 없습니다.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          퍼즐을 완성하면 이곳에 작품이 보관돼요.
        </p>
      </div>
    );
  }

  // 이벤트 정보 매핑
  const eventMap = new Map(events.map(e => [e.id, e]));

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {collection.map(item => {
          const event = eventMap.get(item.event_id);
          if (!event) return null;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setViewing({ event, completedAt: item.completed_at })}
              className="content-surface group relative overflow-hidden rounded-[1.75rem] text-left transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              {/* 완성된 퍼즐 이미지 */}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* 정보 */}
              <div className="p-4">
                <h3 className="truncate font-bold text-foreground">{event.title}</h3>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {format(new Date(item.completed_at), 'yyyy년 M월 d일', { locale: ko })} 완성
                  </span>
                </div>
              </div>

              {/* 소장 뱃지 */}
              <div className="absolute right-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white shadow">
                소장 중
              </div>
            </button>
          );
        })}
      </div>

      {/* 이미지 크게 보기 모달 */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewing(null)}
        >
          <div
            className="relative max-w-3xl w-full animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              type="button"
              aria-label="퍼즐 이미지 닫기"
              onClick={() => setViewing(null)}
              className="absolute -top-11 right-0 rounded-xl p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <X className="h-6 w-6" />
            </button>

            {/* 이미지 */}
            <img
              src={viewing.event.image_url}
              alt={viewing.event.title}
              className="w-full rounded-3xl shadow-2xl"
            />

            {/* 하단 정보 */}
            <div className="mt-3 text-center">
              <h3 className="text-lg font-semibold text-white">{viewing.event.title}</h3>
              {viewing.event.description && (
                <p className="text-sm text-white/70 mt-1">{viewing.event.description}</p>
              )}
              <p className="text-xs text-white/50 mt-2">
                {format(new Date(viewing.completedAt), 'yyyy년 M월 d일', { locale: ko })} 완성
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
