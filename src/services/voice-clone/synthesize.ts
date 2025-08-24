import { supabase } from '@/integrations/supabase/client';

export interface SynthesizeParams {
  text: string;
  modelName: string;
  emotion: string;
  sourceKey: string;
}

export interface SynthesizeResult {
  audioUrl: string;
  audioBuffer?: ArrayBuffer;
  generatedPath?: string;
}

/**
 * Synthesize voice using the voice cloning engine
 * This is a wrapper around the voice cloning functionality
 * 
 * @param params - Parameters for voice synthesis
 * @returns Promise<SynthesizeResult> - Generated audio result
 */
export async function synthesize(params: SynthesizeParams): Promise<SynthesizeResult> {
  const { text, modelName, emotion, sourceKey } = params;

  try {
    // Call the voice generation edge function
    const { data, error } = await supabase.functions.invoke('voice-generate', {
      body: {
        text,
        modelName,
        emotion
      }
    });

    if (error) {
      throw new Error(`Voice synthesis failed: ${error.message}`);
    }

    // TODO: Integrate with the actual voice cloning engine from the higgs_audio folder
    // For now, we return the mock response from the edge function
    // In a real implementation, this would:
    // 1. Load the HiggsAudioModel from the services/voice-clone/higgs_audio folder
    // 2. Process the source audio file
    // 3. Generate new audio using the text input
    // 4. Return the generated audio buffer or URL

    return {
      audioUrl: data.audioUrl,
      generatedPath: data.generatedPath
    };

  } catch (error) {
    console.error('Voice synthesis error:', error);
    throw error;
  }
}

/**
 * Download generated audio file
 * 
 * @param audioUrl - URL of the generated audio
 * @param filename - Filename for the download
 */
export function downloadAudio(audioUrl: string, filename: string = 'generated_voice.wav'): void {
  const link = document.createElement('a');
  link.href = audioUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default synthesize;