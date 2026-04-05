
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, password, name, primary_role, additional_roles, geographic_restrictions } = await req.json()

    console.log('Creating team member with:', { email, name, primary_role, additional_roles, geographic_restrictions })

    // Create the user in auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: primary_role,
        roles: additional_roles || [],
        geographic_restrictions: geographic_restrictions || []
      }
    })

    if (userError) {
      console.error('Error creating user:', userError)
      // Provide a more descriptive error message for common cases
      if (userError.message?.includes('duplicate') || userError.message?.includes('already')) {
        throw new Error(`A user with email "${email}" already exists. Please use a different email address.`)
      }
      throw userError
    }

    console.log('User created:', userData.user?.id)

    // Wait a moment for trigger to create profile, then update it
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Upsert the profile with all the role information
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userData.user?.id,
        name,
        email,
        role: primary_role,
        roles: additional_roles || [],
        geographic_restrictions: geographic_restrictions || [],
        status: 'Active'
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Error updating profile:', profileError)
      throw profileError
    }

    console.log('Profile updated successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: { id: userData.user?.id }  // Fixed: Changed user_id to user.id to match expected structure
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in create_team_member function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
