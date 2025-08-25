import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't redirect if we're already on onboarding or login pages
    if (location.pathname === '/onboarding' || location.pathname === '/login') {
      return;
    }

    // Check if onboarding was completed
    const onboardingCompleted = localStorage.getItem('vegan_vision_onboarding_completed');
    
    if (!onboardingCompleted) {
      // First time user - redirect to onboarding
      navigate('/onboarding', { replace: true });
      return;
    }

    // If onboarding is complete but user is not logged in, redirect to login
    if (!loading && !user) {
      navigate('/login', { 
        replace: true,
        state: { from: location.pathname } // Remember where they were trying to go
      });
      return;
    }
  }, [user, loading, navigate, location.pathname]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if user needs onboarding or login
  const onboardingCompleted = localStorage.getItem('vegan_vision_onboarding_completed');
  if (!onboardingCompleted || !user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
