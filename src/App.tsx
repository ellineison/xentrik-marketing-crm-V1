import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';
import { AuthProvider } from './context/AuthContext';
import { CreatorProvider } from './context/creator';
import { ActivityProvider } from './context/ActivityContext';
import { TeamProvider } from './context/TeamContext';
import { AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Creators from './pages/Creators';
import CreatorProfile from './pages/CreatorProfile';
import CreatorAnalytics from './pages/CreatorAnalytics';
import CreatorInvoice from './pages/CreatorInvoice';
import CreatorOnboarding from './pages/CreatorOnboarding';
import AccountSettings from './pages/AccountSettings';
import Messages from './pages/Messages';
import NotFound from './pages/NotFound';
import UserManagement from './pages/UserManagement';
import Team from './pages/Team';
import TeamMemberProfile from './pages/TeamMemberProfile';
import TeamMemberOnboarding from './pages/TeamMemberOnboarding';
import SecureLogins from './pages/SecureLogins';
import Index from './pages/Index';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { ensureStorageBucket } from "./utils/setupStorage";
import SharedFiles from './pages/SharedFiles';
import MarketingFiles from './pages/MarketingFiles';
import CreatorFiles from './pages/CreatorFiles';
import TeamMemberEdit from './pages/TeamMemberEdit';
import VoiceGeneration from './pages/VoiceGeneration';

import AIVoice from './pages/AIVoice';
import CreatorUpload from './pages/CreatorUpload';
import AccessControlPanel from './pages/AccessControlPanel';
import CreatorInviteOnboarding from './pages/CreatorOnboarding/CreatorInviteOnboarding';
import CreatorOnboardForm from './pages/CreatorOnboardForm';
import CreatorOnboardQueue from './pages/CreatorOnboardQueue';
import CreatorsData from './pages/CreatorsData';
import CustomsTracker from './pages/CustomsTracker';
import Payroll from './pages/Payroll';
import Invitation from './pages/Invitation';

// Call the function to ensure our storage bucket exists
// We're calling it here in a non-blocking way
ensureStorageBucket().catch(err => {
  console.error("Error setting up storage bucket:", err);
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CreatorProvider>
        <ActivityProvider>
          <SupabaseAuthProvider>
            <AuthProvider>
              <TeamProvider>
                <div className="app flex h-screen w-full bg-premium-dark">
                  <Toaster />
                  <AnimatePresence mode="wait">
                    <AppRoutes />
                  </AnimatePresence>
                </div>
              </TeamProvider>
            </AuthProvider>
          </SupabaseAuthProvider>
        </ActivityProvider>
      </CreatorProvider>
    </QueryClientProvider>
  );
}

// Create redirect components that extract the ID from the URL
const CreatorAnalyticsRedirect = () => {
  const location = useLocation();
  const id = location.pathname.split('/').pop();
  return <Navigate to={`/creators/${id}/analytics`} replace />;
};

const CreatorInvoicesRedirect = () => {
  const location = useLocation();
  const id = location.pathname.split('/').pop();
  return <Navigate to={`/creators/${id}/invoices`} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/invitation" element={<Invitation />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/creators" element={<ProtectedRoute><Creators /></ProtectedRoute>} />
      <Route path="/creators/onboard" element={<ProtectedRoute><CreatorOnboarding /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="/team/onboard" element={<ProtectedRoute><TeamMemberOnboarding /></ProtectedRoute>} />
      <Route path="/team/:id" element={<ProtectedRoute><TeamMemberProfile /></ProtectedRoute>} />
      <Route path="/team/:id/edit" element={<ProtectedRoute><TeamMemberEdit /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/access-control" element={<ProtectedRoute><AccessControlPanel /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        <Route path="/shared-files" element={<ProtectedRoute><SharedFiles /></ProtectedRoute>} />
        <Route path="/marketing-files" element={<ProtectedRoute><MarketingFiles /></ProtectedRoute>} />
        <Route path="/creator-files/:id" element={<ProtectedRoute><CreatorFiles /></ProtectedRoute>} />
        <Route path="/creator-marketing-files/:id" element={<ProtectedRoute><CreatorFiles /></ProtectedRoute>} />
      <Route path="/creators/:id" element={<ProtectedRoute><CreatorProfile /></ProtectedRoute>} />
      <Route path="/creators/:id/analytics" element={<ProtectedRoute><CreatorAnalytics /></ProtectedRoute>} />
      <Route path="/creators/:id/invoices" element={<ProtectedRoute><CreatorInvoice /></ProtectedRoute>} />
      <Route path="/secure-logins" element={<ProtectedRoute><SecureLogins /></ProtectedRoute>} />
      <Route path="/secure-logins/:id" element={<ProtectedRoute><SecureLogins /></ProtectedRoute>} />
      <Route path="/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
      <Route path="/shared/:shareCode" element={<SharedFiles />} />
      <Route path="/voice-generation" element={<ProtectedRoute><VoiceGeneration /></ProtectedRoute>} />
      
      <Route path="/ai-voice" element={<ProtectedRoute><AIVoice /></ProtectedRoute>} />
      <Route path="/upload/:id" element={<CreatorUpload />} />
      <Route path="/customs-tracker" element={<ProtectedRoute><CustomsTracker /></ProtectedRoute>} />
      <Route path="/payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
      <Route path="/payroll/:id" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
      
      {/* Add redirects for old route patterns */}
      
      <Route path="/onboard" element={<ProtectedRoute><CreatorOnboardForm /></ProtectedRoute>} />
      <Route path="/onboard-queue" element={<ProtectedRoute><CreatorOnboardQueue /></ProtectedRoute>} />
      <Route path="/creators-data" element={<ProtectedRoute><CreatorsData /></ProtectedRoute>} />
      <Route path="/onboarding-form" element={<CreatorOnboardForm />} />
      <Route path="/onboarding-form/:token" element={<CreatorOnboardForm />} />
      <Route path="/onboard/:token" element={<CreatorInviteOnboarding />} />
      <Route path="/creator-analytics/:id" element={<CreatorAnalyticsRedirect />} />
      <Route path="/creator-invoices/:id" element={<CreatorInvoicesRedirect />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
