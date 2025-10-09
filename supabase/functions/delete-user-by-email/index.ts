import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Missing email parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Find user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error fetching users:", userError);
      return new Response(
        JSON.stringify({ error: `Failed to fetch users: ${userError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: `User with email ${email} not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // Delete related records in order
    const { error: salesError } = await supabaseAdmin
      .from('sales_tracker')
      .delete()
      .eq('chatter_id', userId);

    if (salesError) {
      console.error("Error deleting sales_tracker records:", salesError);
    }

    const { error: attendanceError } = await supabaseAdmin
      .from('attendance')
      .delete()
      .eq('chatter_id', userId);

    if (attendanceError) {
      console.error("Error deleting attendance records:", attendanceError);
    }

    const { error: voiceError } = await supabaseAdmin
      .from('generated_voice_clones')
      .delete()
      .eq('generated_by', userId);

    if (voiceError) {
      console.error("Error deleting voice clones:", voiceError);
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      return new Response(
        JSON.stringify({ error: `Failed to delete profile: ${profileError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Finally delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      return new Response(
        JSON.stringify({ error: `Failed to delete auth user: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `User ${email} (${userId}) deleted successfully` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: `An unexpected error occurred: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
