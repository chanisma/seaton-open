import { useEffect, useMemo, useState } from 'react';
import { Eye, Search, UsersRound } from 'lucide-react';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { Modal } from './Modal';
import { Select } from './Select';
import type { CollectionOwner, OwnershipItem } from '@project-types/ownership.types';

interface AdminOwnershipPanelProps {
  title: string;
  description: string;
  items: OwnershipItem[];
  dateLabel: string;
  isLoading?: boolean;
  error?: string | null;
}

const ROLE_LABEL: Record<CollectionOwner['role'], string> = {
  student: '학생',
  teacher: '교사',
  admin: '관리자',
};

const ownedAtFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

export const AdminOwnershipPanel = ({
  title,
  description,
  items,
  dateLabel,
  isLoading = false,
  error = null,
}: AdminOwnershipPanelProps) => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [isOwnersOpen, setIsOwnersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (items.length === 0) {
      setSelectedItemId('');
      return;
    }

    if (!items.some(item => item.id === selectedItemId)) {
      setSelectedItemId(items[0].id);
    }
  }, [items, selectedItemId]);

  useEffect(() => {
    if (!isOwnersOpen) setSearchQuery('');
  }, [isOwnersOpen]);

  const selectedItem = items.find(item => item.id === selectedItemId) ?? items[0];
  const uniqueOwnerCount = useMemo(
    () => new Set(items.flatMap(item => item.owners.map(owner => owner.id))).size,
    [items]
  );
  const totalOwnershipCount = useMemo(
    () => items.reduce((total, item) => total + item.owners.length, 0),
    [items]
  );
  const filteredOwners = useMemo(() => {
    if (!selectedItem) return [];
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase('ko-KR');
    if (!normalizedQuery) return selectedItem.owners;

    return selectedItem.owners.filter(owner => {
      return `${owner.name} ${owner.email} ${ROLE_LABEL[owner.role]}`
        .toLocaleLowerCase('ko-KR')
        .includes(normalizedQuery);
    });
  }, [searchQuery, selectedItem]);

  return (
    <>
      <section className="content-surface rounded-[2rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UsersRound className="h-5 w-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold tracking-tight text-foreground">{title}</h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  관리자 전용
                </span>
              </div>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
            <Select
              aria-label={`${title} 항목 선택`}
              value={selectedItem?.id ?? ''}
              disabled={isLoading || items.length === 0}
              onChange={event => setSelectedItemId(event.target.value)}
              options={
                items.length > 0
                  ? items.map(item => ({
                      value: item.id,
                      label: `${item.label} · ${item.owners.length}명`,
                    }))
                  : [{ value: '', label: '조회할 소유 기록 없음', disabled: true }]
              }
              className="w-full sm:w-72"
              fullWidth
            />
            <Button
              variant="outline"
              onClick={() => setIsOwnersOpen(true)}
              disabled={isLoading || !selectedItem}
              className="min-h-11 shrink-0"
            >
              <Eye className="h-4 w-4" />
              소유자 보기
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <LoadingSpinner size="sm" />
              소유 현황을 불러오는 중…
            </span>
          ) : (
            <>
              <span>소유 기록 {totalOwnershipCount.toLocaleString('ko-KR')}건</span>
              <span>소유 사용자 {uniqueOwnerCount.toLocaleString('ko-KR')}명</span>
              {selectedItem && (
                <span className="font-semibold text-foreground">
                  {selectedItem.label} · {selectedItem.owners.length.toLocaleString('ko-KR')}명
                </span>
              )}
            </>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            {error}
          </p>
        )}
      </section>

      <Modal
        isOpen={isOwnersOpen && !!selectedItem}
        onClose={() => setIsOwnersOpen(false)}
        title={`${selectedItem?.label ?? ''} 소유자`}
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                총 {selectedItem.owners.length.toLocaleString('ko-KR')}명이 소유하고 있습니다.
              </p>
              {selectedItem.detail && (
                <p className="mt-1 text-xs text-muted-foreground">{selectedItem.detail}</p>
              )}
            </div>

            {selectedItem.owners.length > 0 && (
              <label className="relative block">
                <span className="sr-only">소유자 검색</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="이름 또는 이메일로 검색"
                  className="min-h-11 w-full rounded-xl border border-input bg-card/90 py-2 pl-10 pr-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring/25"
                />
              </label>
            )}

            {selectedItem.owners.length === 0 ? (
              <div className="rounded-2xl bg-muted/40 px-4 py-10 text-center">
                <UsersRound className="mx-auto h-7 w-7 text-muted-foreground/60" />
                <p className="mt-3 text-sm font-semibold text-foreground">
                  아직 소유한 사용자가 없습니다.
                </p>
              </div>
            ) : filteredOwners.length === 0 ? (
              <p className="rounded-2xl bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground">
                검색 결과가 없습니다.
              </p>
            ) : (
              <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60">
                {filteredOwners.map(owner => (
                  <li
                    key={owner.id}
                    className="flex flex-col gap-3 bg-background/55 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        {owner.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {owner.name}
                          </p>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {ROLE_LABEL[owner.role]}
                          </span>
                        </div>
                        {owner.email && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {owner.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="shrink-0 pl-12 text-xs text-muted-foreground sm:pl-0 sm:text-right">
                      <span className="mr-1">{dateLabel}</span>
                      <time dateTime={owner.ownedAt}>
                        {ownedAtFormatter.format(new Date(owner.ownedAt))}
                      </time>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};
