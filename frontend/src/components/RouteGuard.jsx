import { Navigate, Outlet, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RouteGuard = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { id } = useParams();
  const location = useLocation();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Strict URL ID checking (e.g., preventing /student/123 accessing /student/124)
  if (id && user.id.toString() !== id.toString()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RouteGuard;
