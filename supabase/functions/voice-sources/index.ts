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

      // Group by model and emotion for easier frontend consumption
      const groupedSources = voiceSources?.reduce((acc, source) => {
        console.log('Processing voice source:', source);
        if (!acc[source.model_name]) {
          acc[source.model_name] = {};
        }
        if (!acc[source.model_name][source.emotion]) {
          acc[source.model_name][source.emotion] = [];
        }
        acc[source.model_name][source.emotion].push(source);
        return acc;
      }, {} as Record<string, Record<string, any[]>>) || {};

      console.log('Grouped sources:', groupedSources);

      return new Response(
        JSON.stringify({ 
          voiceSources: voiceSources || [],
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
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Set the auth token
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, roles')
        .eq('id', user.id)
        .single();

      if (!profile || (profile.role !== 'Admin' && !profile.roles?.includes('Admin'))) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { id } = await req.json();
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Voice source ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the voice source to delete the file
      const { data: voiceSource } = await supabase
        .from('voice_sources')
        .select('bucket_key')
        .eq('id', id)
        .single();

      if (!voiceSource) {
        return new Response(
          JSON.stringify({ error: 'Voice source not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('voices')
        .remove([voiceSource.bucket_key]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('voice_sources')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        return new Response(
          JSON.stringify({ error: 'Failed to delete voice source' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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