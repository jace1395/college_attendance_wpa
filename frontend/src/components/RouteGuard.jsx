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
  if (allowedRoles) {
    const rolesLower = allowedRoles.map(r => r.toLowerCase());
    const userRole = user?.role?.toLowerCase();
    
    let hasAccess = false;
    if (userRole && rolesLower.includes(userRole)) hasAccess = true;
    if (user?.is_timetable_incharge && rolesLower.includes('timetable_incharge')) hasAccess = true;
    if (user?.is_mentor && rolesLower.includes('mentor')) hasAccess = true;

    
    if (!hasAccess) {
      return <Navigate to="/unauthorized" state={{ reason: "role_check_failed", userRole, rolesLower, hasAccess, originalRole: user?.role, allowedRoles }} replace />;
    }
  }

  // Strict URL ID checking (e.g., preventing /student/123 accessing /student/124)
  if (id && !isNaN(id) && user.id.toString() !== id.toString()) {
    return <Navigate to="/unauthorized" state={{ reason: "id_check_failed", id, userId: user.id }} replace />;
  }

  return <Outlet />;
};

export default RouteGuard;
