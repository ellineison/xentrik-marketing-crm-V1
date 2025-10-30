import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  modelName: string;
  appUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }
    
    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { modelName, appUrl } = await req.json() as RequestBody;
    
    if (!modelName) {
      throw new Error("modelName is required");
    }
    
    console.log("Generating onboarding link for model:", modelName);
    
    // Insert invitation into creator_invitations table
    const { data, error } = await supabase
      .from('creator_invitations')
      .insert({
        model_name: modelName,
        status: 'pending'
      })
      .select('token')
      .single();
    
    if (error) {
      console.error("Error creating invitation:", error);
      throw new Error(`Failed to generate invitation: ${error.message}`);
    }
    
    if (!data || !data.token) {
      throw new Error("No token returned from database");
    }
    
    console.log("Generated token:", data.token);
    
    // Construct the onboarding link
    const baseUrl = appUrl || supabaseUrl.replace('.supabase.co', '.lovable.app');
    const onboardingLink = `${baseUrl}/onboarding-form/${data.token}`;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        token: data.token,
        onboardingLink: onboardingLink
      }),
      { 
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  } catch (error) {
    console.error("Error in generate-onboarding-link function:", error.message);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
});
