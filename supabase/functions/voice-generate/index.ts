import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, modelName, emotion } = await req.json();
    
    console.log('🎤 Voice generation request:', { text, modelName, emotion });

    if (!text || !modelName || !emotion) {
      throw new Error('Missing required parameters: text, modelName, and emotion are required');
    }

    // Get the user ID from the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authorization token');
    }

    console.log('👤 User authenticated:', user.id);

    // Find reference audio from voice_sources table
    const { data: voiceSource, error: voiceSourceError } = await supabase
      .from('voice_sources')
      .select('bucket_key')
      .eq('model_name', modelName)
      .eq('emotion', emotion)
      .single();

    if (voiceSourceError || !voiceSource) {
      console.error('❌ Voice source not found:', voiceSourceError);
      throw new Error(`No voice source found for model "${modelName}" with emotion "${emotion}"`);
    }

    console.log('🎯 Found voice source:', voiceSource.bucket_key);

    // Create a job record in generated_voice_clones table
    const jobId = `voice-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const { data: generatedRecord, error: insertError } = await supabase
      .from('generated_voice_clones')
      .insert({
        bucket_key: '', // Will be updated after successful generation
        model_name: modelName,
        emotion: emotion,
        generated_text: text,
        generated_by: user.id,
        audio_url: '', // Will be updated after successful generation
        job_id: jobId,
        status: 'Pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create job record:', insertError);
      throw new Error('Failed to create generation job');
    }

    console.log('📝 Created job record:', generatedRecord.id);

    // Make API call to the voice generation service
    // Note: Replace this URL with your actual voice generation API endpoint
    const VOICE_API_URL = Deno.env.get('VOICE_GENERATION_API_URL') || 'https://your-voice-api.com/generate';
    
    const voiceApiResponse = await fetch(VOICE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any required API keys here
      },
      body: JSON.stringify({
        text: text,
        model_name: modelName,
        emotion: emotion,
        reference_audio: voiceSource.bucket_key,
        max_completion_tokens: 1024,
        temperature: 1.0,
        top_p: 0.95,
        top_k: 50
      })
    });

    if (!voiceApiResponse.ok) {
      throw new Error(`Voice API request failed: ${voiceApiResponse.status} ${voiceApiResponse.statusText}`);
    }

    const voiceApiResult = await voiceApiResponse.json();
    console.log('🎵 Voice API response received');

    if (!voiceApiResult.success) {
      throw new Error('Voice generation failed');
    }

    // Convert audio data to WAV blob
    const [sampleRate, audioDataArray] = voiceApiResult.audio;
    console.log(`🎶 Processing audio: ${audioDataArray.length} samples at ${sampleRate}Hz`);

    // Create WAV file buffer
    const audioData = new Int16Array(audioDataArray);
    const wavBuffer = createWavBuffer(audioData, sampleRate);
    
    // Generate unique filename
    const timestamp = Date.now();
    const bucketPath = `generated/${modelName}/${emotion}/${timestamp}.wav`;
    
    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voices')
      .upload(bucketPath, wavBuffer, {
        contentType: 'audio/wav',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError);
      throw new Error('Failed to upload generated audio');
    }

    console.log('☁️ Audio uploaded successfully:', bucketPath);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('voices')
      .getPublicUrl(bucketPath);

    // Update the record with success status
    const { error: updateError } = await supabase
      .from('generated_voice_clones')
      .update({
        bucket_key: bucketPath,
        audio_url: urlData.publicUrl,
        status: 'Success',
        generated_text: text, // Save the original input text, not the API's generated_text
        updated_at: new Date().toISOString()
      })
      .eq('id', generatedRecord.id);

    if (updateError) {
      console.error('❌ Failed to update record:', updateError);
      // Don't throw here, audio is already generated successfully
    }

    console.log('✅ Voice generation completed successfully');

    return new Response(JSON.stringify({
      success: true,
      jobId: jobId,
      recordId: generatedRecord.id,
      audioUrl: urlData.publicUrl,
      bucketPath: bucketPath,
      generatedText: text // Return the original input text, not the API's generated_text
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in voice-generate function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper function to create WAV file buffer
function createWavBuffer(audioData: Int16Array, sampleRate: number): Uint8Array {
  const length = audioData.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * 2, true);
  
  // Audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    view.setInt16(offset, audioData[i], true);
    offset += 2;
  }
  
  return new Uint8Array(buffer);
}