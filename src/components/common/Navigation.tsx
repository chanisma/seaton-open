import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  ChevronDown,
  GraduationCap,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { getActiveSungongRooms } from '@services/sungong.service';
import { Button } from './Button';

interface NavigationProps {
  title?: string;
}

export const Navigation = ({ title }: NavigationProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasSungong, setHasSungong] = useState(false);

  useEffect(() => {
    if (user?.type === 'teacher' || user?.type === 'admin') {
      getActiveSungongRooms()
        .then(rooms => setHasSungong(rooms.length > 0))
        .catch(() => setHasSungong(false));
    } else {
      setHasSungong(false);
    }
  }, [user?.type]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const pageContent = document.querySelectorAll<HTMLElement>('main, footer');
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    pageContent.forEach(element => {
      element.inert = true;
    });
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      pageContent.forEach(element => {
        element.inert = false;
      });
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isActive = (path: string) => {
    if (path === '/student' || path === '/teacher') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const studentMenuItems = [
    { path: '/student', label: '대시보드' },
    { path: '/student/reservations', label: '자리 신청' },
    { path: '/student/my-reservations', label: '신청 내역' },
    { path: '/student/puzzle', label: '퍼즐' },
    { path: '/student/badges', label: '뱃지' },
    { path: '/student/focus-forest', label: '집중 모드' },
    { path: '/student/ranking', label: '랭킹' },
  ];

  const teacherMenuItems = [
    { path: '/teacher', label: '대시보드' },
    { path: '/teacher/attendance', label: '출석 체크' },
    ...(hasSungong ? [{ path: '/teacher/sungong', label: '순공' }] : []),
    { path: '/teacher/statistics', label: '통계' },
    { path: '/teacher/ranking', label: '랭킹' },
    { path: '/teacher/reservations', label: '예약 관리' },
  ];

  const adminMenuItems = [
    { path: '/teacher/rooms', label: '열람실 관리' },
    { path: '/teacher/puzzles', label: '퍼즐 관리' },
  ];

  const isAdminInStudentView = user?.type === 'admin' && location.pathname.startsWith('/student');
  const isStudentView = user?.type === 'student' || isAdminInStudentView;
  const menuItems = isStudentView ? studentMenuItems : teacherMenuItems;
  const showAdminMenu = user?.type === 'admin' && !isStudentView;
  const isAdminMenuActive = adminMenuItems.some(item => isActive(item.path));
  const userLabel =
    user?.type === 'student' && user.name
      ? user.name
      : user?.type === 'admin'
        ? '관리자'
        : user?.type === 'teacher'
          ? '교사'
          : user?.email;
  const userMeta =
    user?.type === 'student' && user.meta
      ? `${user.meta.grade}학년 ${user.meta.class}반`
      : user?.email;

  const switchAdminView = () => {
    navigate(isAdminInStudentView ? '/teacher' : '/student');
  };

  return (
    <>
      <nav aria-label="주요 메뉴" className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-4 lg:px-6">
        <div className="floating-surface mx-auto flex h-14 w-full max-w-[1320px] items-center justify-between rounded-[1.35rem] px-2.5 sm:px-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              to="/"
              className="pressable flex shrink-0 items-center gap-2 rounded-xl px-2 py-1.5"
              aria-label="Seaton 홈"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-[0.7rem] bg-primary text-sm font-bold tracking-[-0.04em] text-primary-foreground shadow-[0_7px_16px_-8px_hsl(var(--primary))]">
                S
              </span>
              <span className="hidden text-lg font-bold tracking-[-0.035em] text-foreground sm:block">
                Seaton
              </span>
            </Link>

            {title && (
              <>
                <span className="h-4 w-px bg-border lg:hidden" aria-hidden="true" />
                <span className="max-w-32 truncate text-sm font-semibold text-muted-foreground lg:hidden">
                  {title}
                </span>
              </>
            )}
          </div>

          <div className="hidden min-w-0 items-center rounded-2xl bg-muted/65 p-1 lg:flex">
            {user &&
              menuItems.map(item => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={active ? 'page' : undefined}
                    className={`pressable rounded-xl px-2.5 py-2 text-xs font-semibold xl:px-3 xl:text-sm ${
                      active
                        ? 'bg-card text-foreground shadow-card'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

            {showAdminMenu && (
              <div className="group relative">
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-current={isAdminMenuActive ? 'page' : undefined}
                  className={`pressable flex items-center gap-1 rounded-xl px-2.5 py-2 text-xs font-semibold xl:px-3 xl:text-sm ${
                    isAdminMenuActive
                      ? 'bg-card text-foreground shadow-card'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  관리자
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" />
                </button>
                <div className="invisible absolute left-1/2 top-full z-50 w-48 -translate-x-1/2 translate-y-1 pt-2 opacity-0 transition-[opacity,transform,visibility] duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <div className="floating-surface rounded-2xl p-1.5 shadow-overlay">
                    {adminMenuItems.map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        aria-current={isActive(item.path) ? 'page' : undefined}
                        className={`block rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                          isActive(item.path)
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {user?.type === 'admin' && (
              <button
                type="button"
                onClick={switchAdminView}
                className="pressable hidden min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/70 hover:text-foreground lg:flex xl:px-3"
                title={isAdminInStudentView ? '교사 화면으로 전환' : '학생 화면으로 전환'}
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span className="hidden xl:inline">
                  {isAdminInStudentView ? '교사 화면' : '학생 화면'}
                </span>
              </button>
            )}

            {user && (
              <div className="hidden items-center gap-2 px-2 2xl:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  {user.type === 'student' ? (
                    <GraduationCap className="h-4 w-4" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                </span>
                <span className="max-w-32 leading-tight">
                  <span className="block truncate text-xs font-semibold text-foreground">
                    {userLabel}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {userMeta}
                  </span>
                </span>
              </div>
            )}

            {user && (
              <button
                type="button"
                onClick={handleSignOut}
                className="pressable hidden h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive lg:flex"
                aria-label="로그아웃"
                title="로그아웃"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}

            {user && (
              <button
                type="button"
                className="pressable flex h-10 w-10 items-center justify-center rounded-xl text-foreground hover:bg-muted/75 lg:hidden"
                onClick={() => setIsMobileMenuOpen(open => !open)}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation"
                aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {user && (
        <div
          className={`fixed inset-0 z-40 lg:hidden ${
            isMobileMenuOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
          }`}
          aria-hidden={!isMobileMenuOpen}
        >
          <button
            type="button"
            className={`absolute inset-0 bg-slate-950/20 backdrop-blur-[2px] transition-opacity duration-200 dark:bg-black/45 ${
              isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="메뉴 닫기"
            tabIndex={isMobileMenuOpen ? 0 : -1}
          />

          <section
            id="mobile-navigation"
            aria-label="모바일 메뉴"
            className={`floating-surface absolute inset-x-3 top-[4.75rem] max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-[1.75rem] p-3 shadow-overlay transition-[opacity,transform] duration-300 [transition-timing-function:var(--motion-ease)] sm:inset-x-4 ${
              isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'
            }`}
          >
            <div className="mb-2 flex items-center gap-3 rounded-2xl bg-muted/55 p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                {user.type === 'student' ? (
                  <GraduationCap className="h-5 w-5" />
                ) : (
                  <ShieldCheck className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{userLabel}</p>
                <p className="truncate text-xs text-muted-foreground">{userMeta}</p>
              </div>
            </div>

            <div className="space-y-1">
              {menuItems.map(item => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    tabIndex={isMobileMenuOpen ? 0 : -1}
                    aria-current={active ? 'page' : undefined}
                    className={`pressable flex min-h-12 items-center justify-between rounded-2xl px-4 text-[15px] font-semibold ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-[0_10px_22px_-14px_hsl(var(--primary))]'
                        : 'text-foreground hover:bg-muted/70'
                    }`}
                  >
                    {item.label}
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                  </Link>
                );
              })}
            </div>

            {showAdminMenu && (
              <div className="mt-3 border-t border-border/70 pt-3">
                <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  관리자
                </p>
                <div className="space-y-1">
                  {adminMenuItems.map(item => (
                    <Link
                      key={item.path}
                      to={item.path}
                      tabIndex={isMobileMenuOpen ? 0 : -1}
                      className={`pressable flex min-h-12 items-center rounded-2xl px-4 text-[15px] font-semibold ${
                        isActive(item.path)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted/70'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 grid gap-2 border-t border-border/70 pt-3 sm:grid-cols-2">
              {user.type === 'admin' && (
                <Button
                  variant="secondary"
                  onClick={switchAdminView}
                  tabIndex={isMobileMenuOpen ? 0 : -1}
                  className="w-full"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  {isAdminInStudentView ? '교사 화면으로' : '학생 화면으로'}
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={handleSignOut}
                tabIndex={isMobileMenuOpen ? 0 : -1}
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
};
