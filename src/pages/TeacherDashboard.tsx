import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  DoorOpen,
} from 'lucide-react';
import { Layout } from '@components/common/Layout';
import { getDashboardStats, DashboardStatistics } from '@services/statistics.service';

const clampRate = (value: number) => Math.min(Math.max(value, 0), 100);

export const TeacherDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStatistics | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isActive = true;

    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        if (isActive) setDashboardStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        if (isActive) setHasError(true);
      }
    };

    fetchStats();

    return () => {
      isActive = false;
    };
  }, []);

  const todayHours = dashboardStats?.todayApplicants ?? 0;
  const weeklyHours = dashboardStats?.weeklyApplicants ?? 0;
  const averageAttendanceRate = clampRate(dashboardStats?.averageAttendanceRate ?? 0);
  const formattedToday = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date());

  const metrics = [
    {
      label: '오늘 신청 시간',
      value: todayHours,
      suffix: '시간',
      description: '오늘 운영 일정 기준',
      icon: Clock3,
      className: 'bg-accent/70 text-accent-foreground',
    },
    {
      label: '이번 주 신청 시간',
      value: weeklyHours,
      suffix: '시간',
      description: '월요일부터 오늘까지',
      icon: CalendarDays,
      className: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
    },
    {
      label: '평균 출석률',
      value: averageAttendanceRate,
      suffix: '%',
      description: '전체 학년 평균',
      icon: CheckCircle2,
      className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
  ];

  const quickActions = [
    {
      title: '출석 체크',
      description: '열람실별 출석 상태를 확인하고 기록합니다.',
      to: '/teacher/attendance',
      icon: ClipboardCheck,
      primary: true,
    },
    {
      title: '통계 및 분석',
      description: '학년·기간별 이용 추이를 살펴봅니다.',
      to: '/teacher/statistics',
      icon: BarChart3,
      primary: false,
    },
    {
      title: '예약 관리',
      description: '학생 신청 현황과 좌석 배정을 관리합니다.',
      to: '/teacher/reservations',
      icon: DoorOpen,
      primary: false,
    },
  ];

  return (
    <Layout title="교사 대시보드">
      <h1 className="sr-only">교사 대시보드</h1>

      {hasError && (
        <div
          className="mb-5 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          현황 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </div>
      )}

      <section
        className="content-surface rounded-[2rem] p-5 sm:p-7"
        aria-labelledby="today-overview-title"
      >
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Today overview
            </p>
            <h2
              id="today-overview-title"
              className="mt-1 text-2xl font-bold tracking-[-0.03em] text-foreground sm:text-3xl"
            >
              오늘 운영 현황
            </h2>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-muted/45 px-3.5 py-2 text-sm font-medium text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {formattedToday}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map(metric => {
            const Icon = metric.icon;

            return (
              <article
                key={metric.label}
                className="rounded-[1.5rem] border border-border/65 bg-card p-4 shadow-card sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-muted-foreground">{metric.label}</p>
                    <p className="mt-2 text-3xl font-bold tracking-[-0.04em] text-foreground">
                      {dashboardStats ? metric.value.toLocaleString('ko-KR') : '—'}
                      <span className="ml-1 text-base font-semibold tracking-normal text-muted-foreground">
                        {metric.suffix}
                      </span>
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">{metric.description}</p>
                  </div>
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${metric.className}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                </div>

                {metric.label === '평균 출석률' && (
                  <div className="mt-4">
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label="평균 출석률"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={averageAttendanceRate}
                    >
                      <div
                        className="h-full rounded-full bg-success transition-[width] duration-500"
                        style={{ width: `${averageAttendanceRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <section
          className="content-surface order-2 rounded-[2rem] p-5 sm:p-7 lg:order-1"
          aria-labelledby="grade-overview-title"
        >
          <div className="mb-5">
            <h2
              id="grade-overview-title"
              className="text-xl font-bold tracking-[-0.025em] text-foreground"
            >
              학년별 오늘 현황
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              신청 시간과 출석률을 학년별로 비교합니다.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[1, 2, 3].map(grade => {
              const hours = dashboardStats?.todayApplicantsByGrade?.[grade] ?? 0;
              const attendanceRate = clampRate(dashboardStats?.attendanceRateByGrade?.[grade] ?? 0);
              const share = todayHours > 0 ? Math.round((hours / todayHours) * 100) : 0;

              return (
                <article
                  key={grade}
                  className="rounded-[1.5rem] border border-border/65 bg-muted/30 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-card text-sm font-bold text-primary shadow-card">
                      {grade}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      전체의 {share}%
                    </span>
                  </div>

                  <p className="mt-4 text-2xl font-bold tracking-[-0.03em] text-foreground">
                    {dashboardStats ? hours.toLocaleString('ko-KR') : '—'}
                    <span className="ml-1 text-sm font-semibold text-muted-foreground">시간</span>
                  </p>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">출석률</span>
                    <span className="font-bold text-foreground">{attendanceRate}%</span>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label={`${grade}학년 출석률`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={attendanceRate}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${attendanceRate}%` }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className="content-surface order-1 rounded-[2rem] p-5 sm:p-7 lg:order-2"
          aria-labelledby="quick-actions-title"
        >
          <div className="mb-4">
            <h2
              id="quick-actions-title"
              className="text-xl font-bold tracking-[-0.025em] text-foreground"
            >
              업무 바로가기
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              자주 사용하는 관리 화면으로 이동합니다.
            </p>
          </div>

          <div className="space-y-2.5">
            {quickActions.map(action => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className={`pressable group flex min-h-[5.25rem] items-center gap-3 rounded-2xl border p-3.5 ${
                    action.primary
                      ? 'border-primary bg-primary text-primary-foreground shadow-[0_12px_26px_-16px_hsl(var(--primary))]'
                      : 'border-border/70 bg-card text-foreground shadow-card hover:border-primary/25 hover:bg-accent/45'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      action.primary
                        ? 'bg-white/15 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{action.title}</span>
                    <span
                      className={`mt-0.5 block text-xs leading-relaxed [word-break:keep-all] ${
                        action.primary ? 'text-primary-foreground/75' : 'text-muted-foreground'
                      }`}
                    >
                      {action.description}
                    </span>
                  </span>
                  <ArrowRight
                    className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                      action.primary ? 'text-primary-foreground/75' : 'text-muted-foreground'
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </Layout>
  );
};
