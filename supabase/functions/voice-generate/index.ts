import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, modelName, emotion, jobId } = await req.json();
    
    console.log('🎤 Voice generation request:', { text, modelName, emotion, jobId });

    if (!text || !modelName || !emotion) {
      throw new Error('Missing required parameters: text, modelName, and emotion are required');
    }

    // Authenticate user
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

    // Use the jobId from the client (no duplicate insert here)
    const effectiveJobId = jobId || `voice-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Build the RunPod API URL - append /runsync for synchronous execution
    const VOICE_API_BASE = Deno.env.get('VOICE_GENERATION_API_URL') || '';
    if (!VOICE_API_BASE) {
      throw new Error('VOICE_GENERATION_API_URL is not configured');
    }
    
    // Ensure URL ends with /runsync
    const VOICE_API_URL = VOICE_API_BASE.endsWith('/runsync') || VOICE_API_BASE.endsWith('/run')
      ? VOICE_API_BASE 
      : `${VOICE_API_BASE.replace(/\/$/, '')}/runsync`;

    const RUNPOD_API_KEY = Deno.env.get('RUNPOD_API_KEY');
    if (!RUNPOD_API_KEY) {
      throw new Error('RUNPOD_API_KEY is not configured');
    }

    console.log('🔄 Calling RunPod API:', VOICE_API_URL);

    const voiceApiResponse = await fetch(VOICE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUNPOD_API_KEY}`,
      },
      body: JSON.stringify({
        input: {
          text: text,
          model_name: modelName,
          emotion: emotion,
          reference_audio: voiceSource.bucket_key,
          max_completion_tokens: 1024,
          temperature: 1.0,
          top_p: 0.95,
          top_k: 50
        }
      })
    });

    if (!voiceApiResponse.ok) {
      const errorBody = await voiceApiResponse.text();
      console.error('❌ RunPod API error:', voiceApiResponse.status, errorBody);
      throw new Error(`Voice API request failed: ${voiceApiResponse.status} - ${errorBody}`);
    }

    const voiceApiResult = await voiceApiResponse.json();
    console.log('🎵 RunPod API response received:', JSON.stringify(voiceApiResult).substring(0, 500));

    // Handle RunPod async response format
    if (voiceApiResult.status === 'FAILED') {
      const errMsg = voiceApiResult.error || 'Voice generation failed on RunPod worker';
      console.error('❌ RunPod job failed:', errMsg);
      
      // Update client-created record to Failed
      if (effectiveJobId) {
        await supabase
          .from('generated_voice_clones')
          .update({ status: 'Failed' })
          .eq('job_id', effectiveJobId);
      }
      throw new Error(`Voice generation failed: ${errMsg}`);
    }

    // For /runsync, output is in voiceApiResult.output
    const output = voiceApiResult.output || voiceApiResult;

    if (!output.success && !output.audio) {
      const errMsg = output.error || 'Voice generation returned no audio';
      
      if (effectiveJobId) {
        await supabase
          .from('generated_voice_clones')
          .update({ status: 'Failed' })
          .eq('job_id', effectiveJobId);
      }
      throw new Error(errMsg);
    }

    // Convert audio data to WAV blob
    const audioData = output.audio;
    let wavBuffer: Uint8Array;

    if (Array.isArray(audioData) && audioData.length === 2) {
      // Format: [sampleRate, audioDataArray]
      const [sampleRate, audioDataArray] = audioData;
      console.log(`🎶 Processing audio: ${audioDataArray.length} samples at ${sampleRate}Hz`);
      const int16Data = new Int16Array(audioDataArray);
      wavBuffer = createWavBuffer(int16Data, sampleRate);
    } else if (typeof audioData === 'string') {
      // Base64 encoded WAV
      const binaryStr = atob(audioData);
      wavBuffer = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        wavBuffer[i] = binaryStr.charCodeAt(i);
      }
    } else {
      throw new Error('Unexpected audio format from RunPod worker');
    }

    // Upload to Supabase storage
    const timestamp = Date.now();
    const bucketPath = `generated/${modelName}/${emotion}/${timestamp}.wav`;
    
    const { error: uploadError } = await supabase.storage
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

    const { data: urlData } = supabase.storage
      .from('voices')
      .getPublicUrl(bucketPath);

    // Update the client-created record with success
    if (effectiveJobId) {
      const { error: updateError } = await supabase
        .from('generated_voice_clones')
        .update({
          bucket_key: bucketPath,
          audio_url: urlData.publicUrl,
          status: 'Success',
          generated_text: text,
          updated_at: new Date().toISOString()
        })
        .eq('job_id', effectiveJobId);

      if (updateError) {
        console.error('❌ Failed to update record:', updateError);
      }
    }

    console.log('✅ Voice generation completed successfully');

    return new Response(JSON.stringify({
      success: true,
      jobId: effectiveJobId,
      audioUrl: urlData.publicUrl,
      bucketPath: bucketPath,
      generatedText: text
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

function createWavBuffer(audioData: Int16Array, sampleRate: number): Uint8Array {
  const length = audioData.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  
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
  
  let offset = 44;
  for (let i = 0; i < length; i++) {
    view.setInt16(offset, audioData[i], true);
    offset += 2;
  }
  
  return new Uint8Array(buffer);
}
