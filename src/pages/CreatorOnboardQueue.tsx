
import React, { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AcceptSubmissionModal from "@/components/onboarding/AcceptSubmissionModal";
import SubmissionsTable from "@/components/onboarding/queue/SubmissionsTable";
import LoadingState from "@/components/onboarding/queue/LoadingState";
import EmptyState from "@/components/onboarding/queue/EmptyState";
import { useOnboardingSubmissions } from "@/hooks/useOnboardingSubmissions";
import { useAcceptSubmission } from "@/hooks/useAcceptSubmission";

const CreatorOnboardQueue: React.FC = () => {
  const { user, userRole } = useAuth();
  
  const {
    submissions,
    loading,
    processingTokens,
    fetchSubmissions,
    togglePreview,
    declineSubmission,
    removeSubmissionFromView,
    updateSubmissionData,
    setProcessingTokens,
    formatDate
  } = useOnboardingSubmissions();

  const {
    acceptModalOpen,
    selectedSubmission,
    openAcceptModal,
    setAcceptModalOpen,
    handleAcceptSubmission,
    isProcessing,
    processedTokens
  } = useAcceptSubmission(declineSubmission, removeSubmissionFromView, setProcessingTokens);
  
  // Use memoization to filter submissions only when dependencies change
  const availableSubmissions = useMemo(() => {
    return submissions.filter(sub => !processedTokens.has(sub.token));
  }, [submissions, processedTokens]);

  // Only allow admins to access this page
  if (userRole !== "Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="p-4 md:p-8 w-full">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-foreground">Creator Onboarding Queue</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Review and approve creator onboarding submissions.
        </p>
      </div>
      
      <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <span className="text-lg md:text-xl">Pending Submissions</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchSubmissions}
              disabled={loading}
              className="text-foreground border-border w-full sm:w-auto min-h-[44px] touch-manipulation"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Refresh"
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState />
          ) : availableSubmissions.length === 0 ? (
            <EmptyState />
          ) : (
            <SubmissionsTable 
              submissions={availableSubmissions}
              processingTokens={processingTokens}
              formatDate={formatDate}
              togglePreview={togglePreview}
              deleteSubmission={declineSubmission}
              onAcceptClick={openAcceptModal}
              onUpdateSubmission={updateSubmissionData}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Acceptance Modal */}
      {selectedSubmission && (
        <AcceptSubmissionModal
          isOpen={acceptModalOpen}
          onClose={() => setAcceptModalOpen()}
          onAccept={handleAcceptSubmission}
          defaultName={selectedSubmission.name}
          isLoading={isProcessing || processingTokens.includes(selectedSubmission.token)}
        />
      )}
    </div>
  );
};

export default CreatorOnboardQueue;
