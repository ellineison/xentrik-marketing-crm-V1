
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// Routes that should not be remembered
const EXCLUDED_ROUTES = ['/login', '/register', '/auth', '/tasks-rewards'];

export function useRouteMemory() {
  const location = useLocation();
  
  useEffect(() => {
    // Only store routes that are not excluded
    if (!EXCLUDED_ROUTES.some(route => location.pathname.startsWith(route))) {
      localStorage.setItem('lastVisitedRoute', location.pathname);
    }
  }, [location.pathname]);
  
  const getLastVisitedRoute = () => {
    return localStorage.getItem('lastVisitedRoute') || '/dashboard';
  };
  
  return { getLastVisitedRoute };
}
