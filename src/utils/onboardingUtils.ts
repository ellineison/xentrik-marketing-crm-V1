import { supabase } from "@/integrations/supabase/client";
import { CreatorOnboardingFormValues } from "@/schemas/creatorOnboardingSchema";

/**
 * Validate if a token exists and is still valid (not used)
 */
export const validateToken = async (token: string): Promise<boolean> => {
  try {
    console.log("Validating token:", token);
    
    const { data, error } = await supabase
      .from('creator_invitations')
      .select('status, token, created_at')
      .eq('token', token)
      .maybeSingle();
    
    if (error) {
      console.error('Error validating token:', error);
      return false;
    }
    
    if (!data) {
      console.log('No invitation found for token:', token);
      return false;
    }
    
    console.log('Found invitation data:', data);
    
    // Check if token is still pending (no time-based expiration anymore)
    const isValid = data.status === 'pending';
    console.log('Token validation result:', { 
      status: data.status, 
      isValid
    });
    
    return isValid;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

/**
 * Save the creator onboarding data to the onboarding_submissions table
 */
export const saveOnboardingData = async (
  data: CreatorOnboardingFormValues, 
  token: string | undefined
): Promise<{ success: boolean; submissionId?: string; error?: string }> => {
  try {
    console.log("Starting saveOnboardingData with token:", token);
    
    if (!token) {
      return { 
        success: false, 
        error: "No invitation token provided" 
      };
    }
    
    // First validate the token exists and is still valid
    const isValid = await validateToken(token);
    if (!isValid) {
      return { 
        success: false, 
        error: "Invalid, expired, or already used invitation link" 
      };
    }
    
    // Extract basic required fields
    const name = data.personalInfo?.modelName || data.personalInfo?.fullName || "New Creator";
    const email = data.personalInfo?.email;
    
    // Validate email is provided (required for account creation)
    if (!email || email.trim() === '') {
      return { 
        success: false, 
        error: "Email address is required for account creation" 
      };
    }
    
    // Check if this token has already been submitted
    const { data: existingSubmission } = await supabase
      .from('onboarding_submissions')
      .select('id')
      .eq('token', token)
      .maybeSingle();
    
    if (existingSubmission) {
      return { 
        success: false, 
        error: "This invitation has already been used" 
      };
    }
    
    // Save to onboarding_submissions table
    const { data: submission, error: submissionError } = await supabase
      .from('onboarding_submissions')
      .insert({
        token: token,
        name,
        email,
        data: data,
        status: 'pending'
      })
      .select('id')
      .single();
    
    if (submissionError) {
      console.error("Error saving submission:", submissionError);
      throw submissionError;
    }
    
    // Mark the invitation as completed
    const { error: updateError } = await supabase
      .from('creator_invitations')
      .update({ status: 'completed' })
      .eq('token', token);
    
    if (updateError) {
      console.error("Error updating invitation status:", updateError);
      // Don't fail the submission if we can't update the invitation
    }
    
    console.log("Submission successful with ID:", submission?.id);
    return { success: true, submissionId: submission?.id };
  } catch (error) {
    console.error('Error in saveOnboardingData:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Generate a new invitation token
 */
export const generateInvitationToken = async (
  modelName: string, 
  modelType: 'new' | 'old' = 'old'
): Promise<{ success: boolean; token?: string; error?: string }> => {
  try {
    console.log("Generating invitation for model:", modelName, "type:", modelType);
    
    const { data, error } = await supabase
      .from('creator_invitations')
      .insert({
        model_name: modelName,
        status: 'pending',
        expires_at: null, // No expiration date anymore
        model_type: modelType
      })
      .select('token')
      .single();
    
    if (error) {
      console.error("Error generating invitation:", error);
      throw error;
    }
    
    console.log("Generated invitation token:", data.token);
    return { success: true, token: data.token };
  } catch (error) {
    console.error('Error generating invitation token:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate token' 
    };
  }
};

/**
 * Get model type from invitation token
 */
export const getInvitationModelType = async (token: string): Promise<'new' | 'old' | null> => {
  try {
    const { data, error } = await supabase
      .from('creator_invitations')
      .select('model_type')
      .eq('token', token)
      .maybeSingle();
    
    if (error || !data) {
      return null;
    }
    
    return (data.model_type as 'new' | 'old') || 'old';
  } catch (error) {
    console.error('Error getting invitation model type:', error);
    return null;
  }
};

/**
 * Get all pending invitation tokens
 */
export const getPendingInvitations = async () => {
  try {
    const { data, error } = await supabase
      .from('creator_invitations')
      .select('token, model_name, created_at, expires_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return { success: true, invitations: data || [] };
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch invitations',
      invitations: []
    };
  }
};

/**
 * Cancel/revoke an invitation token
 */
export const cancelInvitationToken = async (token: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('creator_invitations')
      .update({ status: 'cancelled' })
      .eq('token', token);
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error cancelling invitation token:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to cancel token' 
    };
  }
};
