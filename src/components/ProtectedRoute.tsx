import { isAdmin } from '@/utils/auth';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  if (!isAdmin()) {
    // Redirect to login if not admin
    window.location.href = '/login';
    return null;
  }

  return children;
};

export default ProtectedRoute; 