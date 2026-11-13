import { Navigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
import { UserType } from '@project-types/user.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserType[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.type)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
