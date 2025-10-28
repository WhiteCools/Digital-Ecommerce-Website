import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { isAuthenticatedAdmin } from '../utils/adminValidator';

const ProtectedAdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading, checkAuth } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // 🔒 CRITICAL: Re-verify auth state on mount
    if (!loading) {
      checkAuth();
    }
  }, []);

  useEffect(() => {
    // 🔒 Security Check: Verify admin access
    if (!loading) {
      if (!isAuthenticated || !isAuthenticatedAdmin(isAuthenticated, user)) {
        console.warn('🚨 UNAUTHORIZED ACCESS ATTEMPT TO ADMIN PANEL');
        console.warn('   isAuthenticated:', isAuthenticated);
        console.warn('   user:', user);
        console.warn('   timestamp:', new Date().toISOString());
        showToast('Access denied. Administrator privileges required.', 'error');
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, user, loading, navigate, showToast]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-secondary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect if not admin
  if (!isAuthenticatedAdmin(isAuthenticated, user)) {
    return <Navigate to="/" replace />;
  }

  // Render admin content
  return children;
};

export default ProtectedAdminRoute;