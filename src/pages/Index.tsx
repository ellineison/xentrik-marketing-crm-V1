
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Check for a stored route in localStorage
        const lastVisitedRoute = localStorage.getItem('lastVisitedRoute');
        // Navigate to the last visited route or default to dashboard
        navigate(lastVisitedRoute || '/dashboard');
      } else {
        navigate('/login');
      }
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
