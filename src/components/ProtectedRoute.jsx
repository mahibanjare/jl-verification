import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { homeFor } from '../config';

// Blocks the route unless logged in AND (if `roles` given) the user's role
// is allowed. URL-typing can't bypass this; the backend checks again anyway.
const ProtectedRoute = ({ children, roles }) => {
  const { user, session } = useAuthStore();
  if (!user || !session) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
