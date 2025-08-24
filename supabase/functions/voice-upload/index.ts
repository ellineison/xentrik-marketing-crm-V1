import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for server operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user using anon client
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user uploading:', { userId: user.id, email: user.email });

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing POST request...');

    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const formData = await req.formData();
    console.log('FormData entries:', [...formData.entries()].map(([key, value]) => [key, value instanceof File ? `File: ${value.name}` : value]));
    
    const file = formData.get('file') as File;
    const modelName = formData.get('modelName') as string;
    const emotion = formData.get('emotion') as string;

    console.log('Extracted data:', { 
      hasFile: !!file, 
      fileName: file?.name, 
      fileSize: file?.size,
      modelName, 
      emotion 
    });

    if (!file || !modelName || !emotion) {
      console.error('Missing required fields:', { hasFile: !!file, modelName, emotion });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: file, modelName, emotion' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate emotion
    const validEmotions = ['sexual', 'angry', 'excited', 'sweet', 'sad', 'conversational'];
    if (!validEmotions.includes(emotion)) {
      return new Response(
        JSON.stringify({ error: 'Invalid emotion. Must be one of: ' + validEmotions.join(', ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'wav';
    const uniqueId = crypto.randomUUID();
    const bucketKey = `voices/${modelName}/${emotion}/${uniqueId}.${fileExtension}`;

    // Upload file to storage using service role client
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('voices')
      .upload(bucketKey, fileBuffer, {
        contentType: file.type || 'audio/wav',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to upload file', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert record into voice_sources table using service role client
    const { data: voiceSource, error: dbError } = await supabaseClient
      .from('voice_sources')
      .insert({
        model_name: modelName,
        emotion: emotion,
        bucket_key: bucketKey
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file if database insert fails
      await supabaseClient.storage.from('voices').remove([bucketKey]);
      return new Response(
        JSON.stringify({ error: 'Failed to save voice source', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: 'Voice uploaded successfully',
        voiceSource: voiceSource
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in voice-upload function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});