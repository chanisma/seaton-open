import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { AuthProvider } from '@components/auth/AuthProvider';
import { ProtectedRoute } from '@components/auth/ProtectedRoute';
import { LoadingSpinner } from '@components/common/LoadingSpinner';

// Lazy load page components for code splitting
const Login = lazy(() => import('@pages/Login').then(m => ({ default: m.Login })));
const AuthCallback = lazy(() =>
  import('@pages/AuthCallback').then(m => ({ default: m.AuthCallback }))
);
const StudentDashboard = lazy(() =>
  import('@pages/StudentDashboard').then(m => ({ default: m.StudentDashboard }))
);
const TeacherDashboard = lazy(() =>
  import('@pages/TeacherDashboard').then(m => ({ default: m.TeacherDashboard }))
);
const ReservationPage = lazy(() =>
  import('@pages/ReservationPage').then(m => ({ default: m.ReservationPage }))
);
const MyReservationsPage = lazy(() =>
  import('@pages/MyReservationsPage').then(m => ({ default: m.MyReservationsPage }))
);
const TemperatureRankingPage = lazy(() =>
  import('@pages/TemperatureRankingPage').then(m => ({ default: m.TemperatureRankingPage }))
);
const AttendanceCheckPage = lazy(() =>
  import('@pages/AttendanceCheckPage').then(m => ({ default: m.AttendanceCheckPage }))
);
const StatisticsDashboardPage = lazy(() =>
  import('@pages/StatisticsDashboardPage').then(m => ({ default: m.StatisticsDashboardPage }))
);
const DailyAttendancePage = lazy(() =>
  import('@pages/DailyAttendancePage').then(m => ({ default: m.DailyAttendancePage }))
);
const StudentStatisticsPage = lazy(() =>
  import('@pages/StudentStatisticsPage').then(m => ({ default: m.StudentStatisticsPage }))
);
const RoomStatisticsPage = lazy(() =>
  import('@pages/RoomStatisticsPage').then(m => ({ default: m.RoomStatisticsPage }))
);
const BadgePage = lazy(() => import('@pages/BadgePage').then(m => ({ default: m.BadgePage })));
const PuzzlePage = lazy(() => import('@pages/PuzzlePage').then(m => ({ default: m.PuzzlePage })));
const PuzzleManagementPage = lazy(() =>
  import('@pages/admin/PuzzleManagementPage').then(m => ({
    default: m.PuzzleManagementPage,
  }))
);
const FocusForestPage = lazy(() =>
  import('@pages/FocusForestPage').then(m => ({ default: m.FocusForestPage }))
);
const NotFound = lazy(() => import('@pages/NotFound').then(m => ({ default: m.NotFound })));
const SungongPage = lazy(() =>
  import('@pages/SungongPage').then(m => ({ default: m.SungongPage }))
);
const RoomManagement = lazy(() =>
  import('@pages/admin/RoomManagement').then(m => ({ default: m.RoomManagement }))
);
const RoomEditor = lazy(() =>
  import('@pages/admin/RoomEditor').then(m => ({ default: m.RoomEditor }))
);
const ReservationManagementPage = lazy(() =>
  import('@pages/admin/ReservationManagementPage').then(m => ({
    default: m.ReservationManagementPage,
  }))
);

import { StudyRoomProvider } from '@/contexts/StudyRoomContext';

function App() {
  return (
    <AuthProvider>
      <StudyRoomProvider>
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardRedirect />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardRedirect />
                  </ProtectedRoute>
                }
              />

              {/* Student Routes */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/reservations"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <ReservationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/my-reservations"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <MyReservationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/ranking"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <TemperatureRankingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/badges"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <BadgePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/puzzle"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <PuzzlePage />
                  </ProtectedRoute>
                }
              />

              {/* Focus Forest */}
              <Route
                path="/student/focus-forest"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <FocusForestPage />
                  </ProtectedRoute>
                }
              />

              {/* Teacher Routes */}
              <Route
                path="/teacher"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/attendance"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <AttendanceCheckPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/ranking"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <TemperatureRankingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/sungong"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <SungongPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/statistics"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <StatisticsDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/statistics/daily"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <DailyAttendancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/statistics/students"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <StudentStatisticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/statistics/rooms"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <RoomStatisticsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/reservations"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <ReservationManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/puzzles"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PuzzleManagementPage />
                  </ProtectedRoute>
                }
              />
              {/* 관리자 전용 (열람실 관리 / 포커스 에셋) */}
              <Route
                path="/teacher/rooms"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <RoomManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/rooms/new"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <RoomEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/rooms/:roomId"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <RoomEditor />
                  </ProtectedRoute>
                }
              />
              {/* 구 /admin/* 경로 → /teacher/* 리다이렉트 (북마크·외부링크 호환) */}
              <Route path="/admin" element={<Navigate to="/teacher" replace />} />
              <Route path="/admin/rooms" element={<Navigate to="/teacher/rooms" replace />} />
              <Route
                path="/admin/rooms/new"
                element={<Navigate to="/teacher/rooms/new" replace />}
              />
              <Route path="/admin/rooms/:roomId" element={<RedirectAdminRoom />} />
              <Route
                path="/admin/reservations"
                element={<Navigate to="/teacher/reservations" replace />}
              />
              <Route path="/admin/puzzles" element={<Navigate to="/teacher/puzzles" replace />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </StudyRoomProvider>
    </AuthProvider>
  );
}

// 구 /admin/rooms/:roomId → /teacher/rooms/:roomId (파라미터 보존)
const RedirectAdminRoom = () => {
  const { roomId } = useParams();
  return <Navigate to={`/teacher/rooms/${roomId}`} replace />;
};

// 사용자 역할에 따라 대시보드로 리다이렉트
const DashboardRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user?.type === 'student') {
    return <Navigate to="/student" replace />;
  }

  if (user?.type === 'teacher' || user?.type === 'admin') {
    return <Navigate to="/teacher" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default App;
