import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: authHeader ? { Authorization: authHeader } : {}
        }
      }
    );

    if (req.method === 'GET') {
      // Get all voice sources (public endpoint)
      console.log('Fetching voice sources from database...');
      const { data: voiceSources, error } = await supabase
        .from('voice_sources')
        .select('*')
        .order('model_name', { ascending: true });

      console.log('Database query result:', { voiceSources, error });

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch voice sources' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Found voice sources:', voiceSources?.length || 0);

      // Skip per-file storage validation for performance
      // Orphaned records are cleaned up on upload/delete operations
      const validatedSources = voiceSources || [];

      // Group by model and emotion for easier frontend consumption
      const groupedSources = validatedSources.reduce((acc, source) => {
        if (!acc[source.model_name]) {
          acc[source.model_name] = {};
        }
        if (!acc[source.model_name][source.emotion]) {
          acc[source.model_name][source.emotion] = [];
        }
        acc[source.model_name][source.emotion].push(source);
        return acc;
      }, {} as Record<string, Record<string, any[]>>);

      console.log('Grouped sources:', groupedSources);

      return new Response(
        JSON.stringify({ 
          voiceSources: validatedSources,
          groupedSources: groupedSources
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'DELETE') {
      // Get the authorization header
      if (!authHeader) {
        console.error('No auth header for DELETE request');
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create a client with the user's auth token for user verification
      const userSupabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          auth: {
            persistSession: false,
          },
          global: {
            headers: { Authorization: authHeader }
          }
        }
      );

      const { data: { user }, error: authError } = await userSupabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Auth error in DELETE:', authError);
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User authenticated for DELETE:', user.id);

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, roles')
        .eq('id', user.id)
        .single();

      console.log('User profile for DELETE:', profile);

      if (!profile || (profile.role !== 'Admin' && !profile.roles?.includes('Admin'))) {
        console.error('User not admin for DELETE:', profile);
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let requestBody;
      try {
        requestBody = await req.json();
      } catch (error) {
        console.error('Error parsing request body:', error);
        return new Response(
          JSON.stringify({ error: 'Invalid request body' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { id } = requestBody;
      console.log('Deleting voice source with ID:', id);
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Voice source ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the voice source to delete the file
      console.log('Fetching voice source for deletion...');
      const { data: voiceSource, error: fetchError } = await supabase
        .from('voice_sources')
        .select('bucket_key')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching voice source:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Error fetching voice source' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!voiceSource) {
        console.error('Voice source not found:', id);
        return new Response(
          JSON.stringify({ error: 'Voice source not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Voice source found, bucket_key:', voiceSource.bucket_key);

      // Delete from storage
      console.log('Deleting from storage...');
      const { error: storageError } = await supabase.storage
        .from('voices')
        .remove([voiceSource.bucket_key]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database deletion even if storage fails
      } else {
        console.log('Successfully deleted from storage');
      }

      // Delete from database
      console.log('Deleting from database...');
      const { error: dbError } = await supabase
        .from('voice_sources')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete voice source from database' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Successfully deleted voice source:', id);
      return new Response(
        JSON.stringify({ message: 'Voice source deleted successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in voice-sources function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});