
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { creatorId } = await req.json();

    if (!creatorId) {
      return new Response(
        JSON.stringify({
          error: "Missing creatorId parameter",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
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

    console.log(`Deleting creator with ID: ${creatorId}`);

    // Check if creator exists
    const { data: creator, error: creatorLookupError } = await supabaseAdmin
      .from('creators')
      .select('id, email, name, model_name')
      .eq('id', creatorId)
      .maybeSingle();
    
    if (creatorLookupError) {
      console.error("Error looking up creator:", creatorLookupError);
      return new Response(
        JSON.stringify({ error: `Failed to find creator: ${creatorLookupError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!creator) {
      return new Response(
        JSON.stringify({ error: `Creator with ID ${creatorId} not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found creator: ${creator.name} (${creator.email || 'no email'})`);

    // Delete all creator-related records in order (foreign key constraints)
    
    // 1. Delete creator_tags
    const { error: tagsError } = await supabaseAdmin
      .from('creator_tags')
      .delete()
      .eq('creator_id', creatorId);
    if (tagsError) console.error("Error deleting creator_tags:", tagsError);

    // 2. Delete creator_social_links
    const { error: socialLinksError } = await supabaseAdmin
      .from('creator_social_links')
      .delete()
      .eq('creator_id', creatorId);
    if (socialLinksError) console.error("Error deleting creator_social_links:", socialLinksError);

    // 3. Delete creator_team_members (where this is the creator)
    const { error: teamMembersError } = await supabaseAdmin
      .from('creator_team_members')
      .delete()
      .eq('creator_id', creatorId);
    if (teamMembersError) console.error("Error deleting creator_team_members:", teamMembersError);

    // 4. Delete creator_telegram_groups (where this is the creator)
    const { error: telegramGroupsError } = await supabaseAdmin
      .from('creator_telegram_groups')
      .delete()
      .eq('creator_id', creatorId);
    if (telegramGroupsError) console.error("Error deleting creator_telegram_groups:", telegramGroupsError);

    // 5. Delete file_uploads
    const { error: filesError } = await supabaseAdmin
      .from('file_uploads')
      .delete()
      .eq('creator_id', creatorId);
    if (filesError) console.error("Error deleting file_uploads:", filesError);

    // 6. Delete model_announcements (where this is the creator)
    const { error: announcementsError } = await supabaseAdmin
      .from('model_announcements')
      .delete()
      .eq('creator_id', creatorId);
    if (announcementsError) console.error("Error deleting model_announcements:", announcementsError);

    // 7. Delete marketing_media
    const { error: marketingMediaError } = await supabaseAdmin
      .from('marketing_media')
      .delete()
      .eq('creator_id', creatorId);
    if (marketingMediaError) console.error("Error deleting marketing_media:", marketingMediaError);

    // 8. Delete media
    const { error: mediaError } = await supabaseAdmin
      .from('media')
      .delete()
      .eq('creator_id', creatorId);
    if (mediaError) console.error("Error deleting media:", mediaError);

    // 9. Delete social_media_logins by creator email (if email exists)
    if (creator.email) {
      const { error: socialLoginsError } = await supabaseAdmin
        .from('social_media_logins')
        .delete()
        .eq('creator_email', creator.email);
      if (socialLoginsError) console.error("Error deleting social_media_logins:", socialLoginsError);
      else console.log(`Deleted social_media_logins for email: ${creator.email}`);
    } else {
      console.log("No email found for creator, skipping social_media_logins deletion by email");
    }

    // 10. Delete records by model_name (these tables use model_name as a string field)
    if (creator.model_name) {
      console.log(`Deleting records by model_name: ${creator.model_name}`);
      const { error: customsError } = await supabaseAdmin
        .from('customs')
        .delete()
        .eq('model_name', creator.model_name);
      if (customsError) console.error("Error deleting customs:", customsError);

      const { error: salesTrackerError } = await supabaseAdmin
        .from('sales_tracker')
        .delete()
        .eq('model_name', creator.model_name);
      if (salesTrackerError) console.error("Error deleting sales_tracker:", salesTrackerError);

      const { error: attendanceError } = await supabaseAdmin
        .from('attendance')
        .delete()
        .eq('model_name', creator.model_name);
      if (attendanceError) console.error("Error deleting attendance:", attendanceError);

      // Delete creator_invoicing records by model_name
      const { error: invoicingError } = await supabaseAdmin
        .from('creator_invoicing')
        .delete()
        .eq('model_name', creator.model_name);
      if (invoicingError) console.error("Error deleting creator_invoicing:", invoicingError);
      else console.log(`Deleted creator_invoicing records for model_name: ${creator.model_name}`);

      const { error: voiceSourcesError } = await supabaseAdmin
        .from('voice_sources')
        .delete()
        .eq('model_name', creator.model_name);
      if (voiceSourcesError) console.error("Error deleting voice_sources:", voiceSourcesError);
    }

    // 11. Delete file_categories for this creator
    const { error: categoriesError } = await supabaseAdmin
      .from('file_categories')
      .delete()
      .eq('creator', creatorId);
    if (categoriesError) console.error("Error deleting file_categories:", categoriesError);

    // 12. Delete file_tags for this creator
    const { error: fileTagsError } = await supabaseAdmin
      .from('file_tags')
      .delete()
      .eq('creator', creatorId);
    if (fileTagsError) console.error("Error deleting file_tags:", fileTagsError);

    // 13. Delete file_folders for this creator
    const { error: foldersError } = await supabaseAdmin
      .from('file_folders')
      .delete()
      .eq('creator_id', creatorId);
    if (foldersError) console.error("Error deleting file_folders:", foldersError);

    // 13.5. Delete onboarding_submissions for this creator (by email and model_name)
    console.log(`Attempting to delete onboarding_submissions for creator: ${creator.name}, email: ${creator.email}, model_name: ${creator.model_name}`);
    
    // First, try to delete by email if it exists
    if (creator.email) {
      const { error: onboardingError, count: emailCount } = await supabaseAdmin
        .from('onboarding_submissions')
        .delete({ count: 'exact' })
        .eq('email', creator.email);
      if (onboardingError) {
        console.error("Error deleting onboarding_submissions by email:", onboardingError);
      } else {
        console.log(`Deleted ${emailCount || 0} onboarding_submissions records by email: ${creator.email}`);
      }
    }
    
    // Also try to delete by model_name in the JSON data field
    if (creator.model_name) {
      const { data: matchingSubmissions, error: findError } = await supabaseAdmin
        .from('onboarding_submissions')
        .select('id, email, data')
        .eq('status', 'accepted');
      
      if (!findError && matchingSubmissions) {
        console.log(`Found ${matchingSubmissions.length} accepted submissions to check for model_name match`);
        
        for (const submission of matchingSubmissions) {
          const submissionModelName = submission.data?.personalInfo?.modelName;
          if (submissionModelName && submissionModelName.toLowerCase() === creator.model_name.toLowerCase()) {
            console.log(`Found matching onboarding_submission by model_name: ${submissionModelName}, deleting submission id: ${submission.id}`);
            const { error: deleteError } = await supabaseAdmin
              .from('onboarding_submissions')
              .delete()
              .eq('id', submission.id);
            if (deleteError) {
              console.error(`Error deleting onboarding_submission ${submission.id}:`, deleteError);
            } else {
              console.log(`Successfully deleted onboarding_submission ${submission.id} for model_name: ${submissionModelName}`);
            }
          }
        }
      } else if (findError) {
        console.error("Error finding matching onboarding_submissions by model_name:", findError);
      }
    }

    // 14. Delete the creator record
    const { error: creatorError } = await supabaseAdmin
      .from('creators')
      .delete()
      .eq('id', creatorId);

    if (creatorError) {
      console.error("Error deleting creator:", creatorError);
      return new Response(
        JSON.stringify({
          error: `Failed to delete creator: ${creatorError.message}`,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 16. Delete related profile and auth records (if creator has auth)
    // First check if there's a profile with this ID
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('id', creatorId)
      .maybeSingle();

    if (profile) {
      console.log(`Creator ${creatorId} has a profile, deleting related records...`);
      
      // Delete profile-related records
      await supabaseAdmin.from('team_member_roles').delete().eq('profile_id', creatorId);
      await supabaseAdmin.from('team_assignments').delete().eq('profile_id', creatorId);
      
      // Delete creator_team_members (where this person is a team member)
      await supabaseAdmin.from('creator_team_members').delete().eq('team_member_id', creatorId);
      
      // Delete creator_telegram_groups (where this person is a team member)
      await supabaseAdmin.from('creator_telegram_groups').delete().eq('team_member_id', creatorId);
      
      // Delete model_announcements created by this user
      await supabaseAdmin.from('model_announcements').delete().eq('created_by', creatorId);
      
      await supabaseAdmin.from('sales_tracker').delete().eq('chatter_id', creatorId);
      await supabaseAdmin.from('attendance').delete().eq('chatter_id', creatorId);
      await supabaseAdmin.from('generated_voice_clones').delete().eq('generated_by', creatorId);

      // Delete the profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', creatorId);
      
      if (profileError) {
        console.error("Error deleting profile:", profileError);
      } else {
        console.log(`Deleted profile for creator ${creatorId}`);
      }

      // Check if auth user exists before trying to delete
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = users?.find(u => u.id === creatorId || u.email === profile.email);
      
      if (authUser) {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(creatorId);
        
        if (authError) {
          console.error("Error deleting auth user:", authError);
        } else {
          console.log(`Deleted auth account for creator ${creatorId}`);
        }
      } else {
        console.log(`No auth account found for creator ${creatorId}, skipping auth deletion`);
      }
    } else {
      console.log(`Creator ${creatorId} has no profile, skipping profile/auth deletion`);
    }

    console.log(`Successfully deleted creator ${creatorId}`);
    return new Response(
      JSON.stringify({ success: true, message: "Creator deleted successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: `An unexpected error occurred: ${error.message}`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
