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

    // First, try to find profile by email (may not have auth account)
    const { data: profile, error: profileLookupError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    if (profileLookupError) {
      console.error("Error looking up profile:", profileLookupError);
      return new Response(
        JSON.stringify({ error: `Failed to find profile: ${profileLookupError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this email has a creator record (even if no profile exists)
    const { data: creatorByEmail } = await supabaseAdmin
      .from('creators')
      .select('id, model_name, email')
      .eq('email', email)
      .maybeSingle();

    if (!profile && !creatorByEmail) {
      return new Response(
        JSON.stringify({ error: `User with email ${email} not found in profiles or creators` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = profile?.id;
    console.log(`Deleting user ${email}${userId ? ` with ID: ${userId}` : ' (no profile found)'}`);

    // Check if there's an auth account
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = users?.find(u => u.email === email);
    
    if (listError) {
      console.error("Warning: Error checking auth users:", listError);
    }

    // Check if this user is also a creator - search by email AND by id (if userId exists)
    const { data: creator } = await supabaseAdmin
      .from('creators')
      .select('id, model_name, email')
      .or(userId ? `id.eq.${userId},email.eq.${email}` : `email.eq.${email}`)
      .maybeSingle();

    // Capture model_name for deletion before we delete the creator
    let modelNameForDeletion: string | null = null;
    
    // If user is also a creator, delete all creator-related records first
    if (creator) {
      modelNameForDeletion = creator.model_name;
      console.log(`User is also a creator (${creator.model_name || creator.email}), deleting creator records...`);

      // Delete creator_tags
      await supabaseAdmin.from('creator_tags').delete().eq('creator_id', userId);

      // Delete creator_social_links
      await supabaseAdmin.from('creator_social_links').delete().eq('creator_id', userId);

      // Delete creator_team_members (where this is the creator)
      await supabaseAdmin.from('creator_team_members').delete().eq('creator_id', userId);

      // Delete creator_telegram_groups (where this is the creator)
      await supabaseAdmin.from('creator_telegram_groups').delete().eq('creator_id', userId);

      // Delete file_uploads
      await supabaseAdmin.from('file_uploads').delete().eq('creator_id', userId);

      // Delete model_announcements (where this is the creator)
      await supabaseAdmin.from('model_announcements').delete().eq('creator_id', userId);

      // Delete marketing_media
      await supabaseAdmin.from('marketing_media').delete().eq('creator_id', userId);

      // Delete media
      await supabaseAdmin.from('media').delete().eq('creator_id', userId);

      // Delete social_media_logins by creator email
      if (creator.email) {
        await supabaseAdmin.from('social_media_logins').delete().eq('creator_email', creator.email);
        console.log(`Deleted social_media_logins for creator email: ${creator.email}`);
      }
      
      // Also delete by the main email parameter (in case creator email differs)
      await supabaseAdmin.from('social_media_logins').delete().eq('creator_email', email);
      console.log(`Deleted social_media_logins for email: ${email}`);

      // Delete records by model_name (these tables use model_name as a string field, not foreign key)
      if (creator.model_name) {
        console.log(`Deleting records by model_name: ${creator.model_name}`);
        await supabaseAdmin.from('customs').delete().eq('model_name', creator.model_name);
        await supabaseAdmin.from('sales_tracker').delete().eq('model_name', creator.model_name);
        await supabaseAdmin.from('attendance').delete().eq('model_name', creator.model_name);
        await supabaseAdmin.from('voice_sources').delete().eq('model_name', creator.model_name);
      }

      // Delete file_categories for this creator
      await supabaseAdmin.from('file_categories').delete().eq('creator', creator.id);

      // Delete file_tags for this creator
      await supabaseAdmin.from('file_tags').delete().eq('creator', creator.id);

      // Delete file_folders for this creator
      await supabaseAdmin.from('file_folders').delete().eq('creator_id', creator.id);

      // Delete the creator record
      const { error: creatorError } = await supabaseAdmin
        .from('creators')
        .delete()
        .eq('id', creator.id);
      
      if (creatorError) {
        console.error("Error deleting creator:", creatorError);
      } else {
        console.log(`Deleted creator record for ${creator.id}`);
      }
    }

    // IMPORTANT: Delete records by model_name even if creator was already deleted
    // This handles cases where creator was deleted but model_name records remain
    if (modelNameForDeletion) {
      console.log(`Cleaning up any remaining records for model_name: ${modelNameForDeletion}`);
      await supabaseAdmin.from('customs').delete().eq('model_name', modelNameForDeletion);
      await supabaseAdmin.from('sales_tracker').delete().eq('model_name', modelNameForDeletion);
      await supabaseAdmin.from('attendance').delete().eq('model_name', modelNameForDeletion);
      await supabaseAdmin.from('voice_sources').delete().eq('model_name', modelNameForDeletion);
    }

    // Delete all user/profile related records (only if profile exists)
    if (userId) {
      // 1. Delete team_member_roles
      const { error: rolesError } = await supabaseAdmin
        .from('team_member_roles')
        .delete()
        .eq('profile_id', userId);
      if (rolesError) console.error("Error deleting team_member_roles:", rolesError);

      // 2. Delete team_assignments
      const { error: assignmentsError } = await supabaseAdmin
        .from('team_assignments')
        .delete()
        .eq('profile_id', userId);
      if (assignmentsError) console.error("Error deleting team_assignments:", assignmentsError);

      // 3. Delete creator_team_members (where this person is a team member)
      const { error: creatorTeamError } = await supabaseAdmin
        .from('creator_team_members')
        .delete()
        .eq('team_member_id', userId);
      if (creatorTeamError) console.error("Error deleting creator_team_members:", creatorTeamError);

      // 4. Delete creator_telegram_groups (where this person is a team member)
      const { error: telegramError } = await supabaseAdmin
        .from('creator_telegram_groups')
        .delete()
        .eq('team_member_id', userId);
      if (telegramError) console.error("Error deleting creator_telegram_groups:", telegramError);

      // 5. Delete model_announcements created by this user
      const { error: announcementsError } = await supabaseAdmin
        .from('model_announcements')
        .delete()
        .eq('created_by', userId);
      if (announcementsError) console.error("Error deleting model_announcements:", announcementsError);

      // 6. Delete sales_tracker records by chatter_id
      const { error: salesError } = await supabaseAdmin
        .from('sales_tracker')
        .delete()
        .eq('chatter_id', userId);
      if (salesError) console.error("Error deleting sales_tracker:", salesError);

      // 7. Delete attendance records by chatter_id
      const { error: attendanceError } = await supabaseAdmin
        .from('attendance')
        .delete()
        .eq('chatter_id', userId);
      if (attendanceError) console.error("Error deleting attendance:", attendanceError);

      // 8. Delete generated_voice_clones
      const { error: voiceError } = await supabaseAdmin
        .from('generated_voice_clones')
        .delete()
        .eq('generated_by', userId);
      if (voiceError) console.error("Error deleting voice clones:", voiceError);

      // 9. Delete the profile
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

      console.log(`Deleted profile for ${email}`);
    }

    // 10. Finally delete the auth user (if exists)
    if (authUser && userId) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        console.error("Error deleting auth user:", authError);
        return new Response(
          JSON.stringify({ error: `Failed to delete auth user: ${authError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log(`Deleted auth account for ${email}`);
    } else {
      console.log(`No auth account found for ${email}, skipping auth deletion`);
    }

    console.log(`Successfully deleted user ${email}`);
    return new Response(
      JSON.stringify({ success: true, message: `User ${email} deleted successfully` }),
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
