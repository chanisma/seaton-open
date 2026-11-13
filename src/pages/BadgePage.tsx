import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@hooks/useAuth';
import { Layout } from '@components/common/Layout';
import { AdminOwnershipPanel } from '@components/common/AdminOwnershipPanel';
import { Modal } from '@components/common/Modal';
import { Button } from '@components/common/Button';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import {
  getAllBadges,
  getAcquiredBadges,
  acquireBadge,
  selectBadge,
  getSelectedBadgeId,
  getBadgeOwnershipByBadge,
} from '@services/badge.service';
import { getStudentTemperature } from '@services/reservation.service';
import type { BadgeWithStatus } from '@project-types/badge.types';
import type { CollectionOwner, OwnershipItem } from '@project-types/ownership.types';
import { Award, Gift, Lock, Thermometer, Check } from 'lucide-react';

export const BadgePage = () => {
  const { isAdmin, user } = useAuth();
  const [badges, setBadges] = useState<BadgeWithStatus[]>([]);
  const [temperature, setTemperature] = useState<number>(28.0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBadgeId, setSelectedBadgeId] = useState<number | null>(null);
  const [viewingBadge, setViewingBadge] = useState<BadgeWithStatus | null>(null);
  const [openingBadge, setOpeningBadge] = useState<BadgeWithStatus | null>(null);
  const [revealedBadge, setRevealedBadge] = useState<BadgeWithStatus | null>(null);
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [ownershipByBadge, setOwnershipByBadge] = useState<Record<number, CollectionOwner[]>>({});
  const [isOwnershipLoading, setIsOwnershipLoading] = useState(false);
  const [ownershipError, setOwnershipError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.profile_id) return;
      setIsLoading(true);
      try {
        const [allBadges, acquired, temp, selId] = await Promise.all([
          getAllBadges(),
          getAcquiredBadges(user.profile_id),
          getStudentTemperature(user.profile_id),
          getSelectedBadgeId(user.profile_id),
        ]);
        setSelectedBadgeId(selId);

        setTemperature(temp);

        const acquiredMap = new Map(acquired.map(a => [a.badge_id, a.acquired_at]));
        const badgesWithStatus: BadgeWithStatus[] = allBadges.map(badge => ({
          ...badge,
          acquired: acquiredMap.has(badge.id),
          acquired_at: acquiredMap.get(badge.id),
          eligible: isAdmin || temp >= badge.temperature,
        }));
        setBadges(badgesWithStatus);
      } catch (error) {
        console.error('Failed to load badge data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [isAdmin, user?.profile_id]);

  useEffect(() => {
    if (!isAdmin) {
      setOwnershipByBadge({});
      setOwnershipError(null);
      return;
    }

    let cancelled = false;
    setIsOwnershipLoading(true);
    setOwnershipError(null);

    getBadgeOwnershipByBadge()
      .then(ownership => {
        if (!cancelled) setOwnershipByBadge(ownership);
      })
      .catch(error => {
        console.error('Failed to load badge ownership:', error);
        if (!cancelled) setOwnershipError('뱃지 소유 현황을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setIsOwnershipLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const stats = useMemo(() => {
    const total = badges.length;
    const acquired = badges.filter(b => b.acquired).length;
    const eligible = badges.filter(b => b.eligible && !b.acquired).length;
    const nextBadge = badges
      .filter(badge => !badge.acquired)
      .sort((a, b) => a.temperature - b.temperature)[0];
    return { total, acquired, eligible, nextBadge };
  }, [badges]);

  const ownershipItems = useMemo<OwnershipItem[]>(
    () =>
      badges.map(badge => ({
        id: String(badge.id),
        label: badge.name,
        detail: `${badge.temperature}°C · ${badge.description}`,
        owners: ownershipByBadge[badge.id] ?? [],
      })),
    [badges, ownershipByBadge]
  );

  const handleViewBadge = (badge: BadgeWithStatus) => {
    if (!badge.acquired) return;
    setViewingBadge(badge);
  };

  const handleSelectFromModal = async () => {
    if (!user?.profile_id || !viewingBadge) return;
    setIsSelecting(true);
    try {
      await selectBadge(user.profile_id, viewingBadge.id);
      setSelectedBadgeId(viewingBadge.id);
      setViewingBadge(null);
    } catch (error) {
      console.error('Failed to select badge:', error);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleOpenBox = async (badge: BadgeWithStatus) => {
    if (!user?.profile_id || badge.acquired || !badge.eligible) return;
    setOpeningBadge(badge);
  };

  const handleConfirmAcquire = async () => {
    if (!openingBadge || !user?.profile_id) return;
    setIsAcquiring(true);
    try {
      await acquireBadge(openingBadge.id);
      // 획득 성공 → 뱃지 공개 모달로 전환
      const updated = { ...openingBadge, acquired: true, acquired_at: new Date().toISOString() };
      setBadges(prev => prev.map(b => (b.id === openingBadge.id ? updated : b)));
      setOpeningBadge(null);
      setRevealedBadge(updated);
    } catch (error) {
      console.error('Failed to acquire badge:', error);
    } finally {
      setIsAcquiring(false);
    }
  };

  if (isLoading) {
    return (
      <Layout title="뱃지">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="뱃지">
      <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        <h1 className="sr-only">나의 뱃지 컬렉션</h1>

        {isAdmin && (
          <AdminOwnershipPanel
            title="뱃지 소유 현황"
            description="뱃지를 선택해 획득한 사용자와 획득 날짜를 확인하세요."
            items={ownershipItems}
            dateLabel="획득"
            isLoading={isOwnershipLoading}
            error={ownershipError}
          />
        )}

        <section className="content-surface flex flex-col gap-4 rounded-[2rem] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Award className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">나의 뱃지 컬렉션</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                온도를 높이고 새로운 뱃지를 수집해 보세요.
              </p>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-orange-500/10 px-3.5 py-2 text-orange-700 dark:text-orange-300">
            <Thermometer className="h-4 w-4" />
            <span className="text-sm font-semibold">현재 온도</span>
            <strong className="text-base tabular-nums">{temperature}°C</strong>
          </div>
        </section>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <div className="content-surface col-span-2 flex items-center justify-between rounded-[1.5rem] p-4 lg:col-span-1 sm:p-5">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">다음 뱃지까지</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                {!stats.nextBadge
                  ? '모두 획득'
                  : stats.nextBadge.eligible
                    ? '지금 획득 가능'
                    : `${Math.max(0, stats.nextBadge.temperature - temperature).toFixed(1)}°C`}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
              <Thermometer className="h-5 w-5" />
            </span>
          </div>
          <div className="content-surface flex items-center justify-between rounded-[1.5rem] p-4 sm:p-5">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">획득한 뱃지</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
                {stats.acquired}
                <span className="text-sm text-muted-foreground">/{stats.total}</span>
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Award className="h-5 w-5" />
            </span>
          </div>
          <div className="content-surface flex items-center justify-between rounded-[1.5rem] p-4 sm:p-5">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">열 수 있는 상자</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {stats.eligible}
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <Gift className="h-5 w-5" />
            </span>
          </div>
        </div>

        {/* 뱃지 그리드 */}
        <section className="content-surface rounded-[2rem] p-4 sm:p-7">
          <div className="mb-5">
            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              전체 뱃지
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              획득한 뱃지를 눌러 대표 뱃지로 설정할 수 있어요.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {badges.map(badge => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                isSelected={selectedBadgeId === badge.id}
                onOpen={handleOpenBox}
                onView={handleViewBadge}
              />
            ))}
          </div>
        </section>
      </div>

      {/* 뱃지 정보 모달 */}
      <Modal isOpen={!!viewingBadge} onClose={() => setViewingBadge(null)} size="sm">
        {viewingBadge && (
          <div className="text-center space-y-6 py-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-500 uppercase tracking-wider">
                {viewingBadge.temperature}°C 뱃지
              </p>
              <h2 className="text-2xl font-bold text-foreground">{viewingBadge.name}</h2>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200/30 to-orange-200/30 dark:from-amber-800/20 dark:to-orange-800/20 rounded-full blur-2xl" />
              <img
                src={viewingBadge.image_path}
                alt={viewingBadge.name}
                className="w-32 h-32 mx-auto object-contain relative z-10 drop-shadow-lg"
              />
            </div>
            <p className="text-base text-muted-foreground px-4 leading-relaxed">
              {viewingBadge.description}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setViewingBadge(null)}>
                닫기
              </Button>
              <Button
                variant="primary"
                onClick={handleSelectFromModal}
                isLoading={isSelecting}
                disabled={isSelecting || selectedBadgeId === viewingBadge.id}
              >
                {selectedBadgeId === viewingBadge.id ? '대표 뱃지로 설정됨' : '대표 뱃지로 설정'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 상자 열기 확인 모달 */}
      <Modal
        isOpen={!!openingBadge}
        onClose={() => setOpeningBadge(null)}
        title="상자 열기"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpeningBadge(null)}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmAcquire}
              isLoading={isAcquiring}
              disabled={isAcquiring}
            >
              열기
            </Button>
          </div>
        }
      >
        <div className="text-center space-y-4 py-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-2xl flex items-center justify-center animate-bounce-subtle">
            <Gift className="w-10 h-10 text-amber-500" />
          </div>
          <div>
            <p className="text-lg font-semibold text-foreground">
              {openingBadge?.temperature}°C 뱃지 상자
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              상자를 열어 뱃지를 획득하시겠습니까?
            </p>
          </div>
        </div>
      </Modal>

      {/* 뱃지 공개 모달 */}
      <Modal isOpen={!!revealedBadge} onClose={() => setRevealedBadge(null)} size="sm">
        <div className="text-center space-y-6 py-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-amber-500 uppercase tracking-wider">
              뱃지 획득!
            </p>
            <h2 className="text-2xl font-bold text-foreground">{revealedBadge?.name}</h2>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-200/30 to-orange-200/30 dark:from-amber-800/20 dark:to-orange-800/20 rounded-full blur-2xl" />
            <img
              src={revealedBadge?.image_path}
              alt={revealedBadge?.name}
              className="w-32 h-32 mx-auto object-contain relative z-10 animate-scale-in drop-shadow-lg"
            />
          </div>
          <p className="text-base text-muted-foreground px-4 leading-relaxed">
            {revealedBadge?.description}
          </p>
          <Button variant="primary" onClick={() => setRevealedBadge(null)} className="px-8">
            확인
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};

/** 개별 뱃지 카드 */
const BadgeCard = ({
  badge,
  isSelected,
  onOpen,
  onView,
}: {
  badge: BadgeWithStatus;
  isSelected: boolean;
  onOpen: (badge: BadgeWithStatus) => void;
  onView: (badge: BadgeWithStatus) => void;
}) => {
  // 획득함: 뱃지 이미지 표시 + 클릭으로 정보 모달
  if (badge.acquired) {
    return (
      <button
        type="button"
        onClick={() => onView(badge)}
        className={`group relative flex min-h-40 flex-col items-center justify-center rounded-2xl border bg-background/70 p-3 text-center transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 sm:p-4 ${
          isSelected ? 'border-amber-500/50 ring-2 ring-amber-500/20' : 'border-border/60'
        }`}
      >
        {isSelected && (
          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500">
            <Check className="h-3 w-3 text-white" />
          </span>
        )}
        <img
          src={badge.image_path}
          alt={badge.name}
          className="mb-3 h-16 w-16 object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-105 sm:h-20 sm:w-20"
        />
        <p className="text-sm font-semibold text-foreground">{badge.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{badge.temperature}°C</p>
      </button>
    );
  }

  // 자격 있음: 열 수 있는 상자
  if (badge.eligible) {
    return (
      <div className="group flex min-h-40 flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/[0.045] p-3 text-center sm:p-4">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 sm:h-20 sm:w-20">
          <Gift className="h-8 w-8 text-amber-500 sm:h-10 sm:w-10" />
        </div>
        <p className="text-sm font-semibold text-foreground">{badge.temperature}°C</p>
        <button
          type="button"
          onClick={() => onOpen(badge)}
          className="mt-2 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
        >
          열기
        </button>
      </div>
    );
  }

  // 자격 없음: 잠긴 상자
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-border/50 bg-muted/25 p-3 text-center opacity-70 sm:p-4">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted sm:h-20 sm:w-20">
        <Lock className="h-8 w-8 text-muted-foreground sm:h-10 sm:w-10" />
      </div>
      <p className="text-sm font-semibold text-muted-foreground">{badge.temperature}°C</p>
      <p className="mt-1 text-xs text-muted-foreground">미달성</p>
    </div>
  );
};
