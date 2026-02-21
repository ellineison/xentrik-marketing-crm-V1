import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Curated list of interesting words for chatters
const WORD_LIST = [
  { word: "Effervescent", definition: "Bubbling with enthusiasm or liveliness", part_of_speech: "adjective" },
  { word: "Serendipity", definition: "Finding something good without looking for it", part_of_speech: "noun" },
  { word: "Eloquent", definition: "Fluent and persuasive in speaking or writing", part_of_speech: "adjective" },
  { word: "Ephemeral", definition: "Lasting for a very short time", part_of_speech: "adjective" },
  { word: "Mellifluous", definition: "Sweet-sounding; pleasant to hear", part_of_speech: "adjective" },
  { word: "Resplendent", definition: "Shining brilliantly; splendid", part_of_speech: "adjective" },
  { word: "Sanguine", definition: "Optimistic or positive, especially in difficult situations", part_of_speech: "adjective" },
  { word: "Loquacious", definition: "Tending to talk a great deal; talkative", part_of_speech: "adjective" },
  { word: "Ebullient", definition: "Full of cheerful energy and enthusiasm", part_of_speech: "adjective" },
  { word: "Perspicacious", definition: "Having keen insight; shrewd", part_of_speech: "adjective" },
  { word: "Vivacious", definition: "Attractively lively and animated", part_of_speech: "adjective" },
  { word: "Quintessential", definition: "Representing the perfect example of something", part_of_speech: "adjective" },
  { word: "Ineffable", definition: "Too great to be expressed in words", part_of_speech: "adjective" },
  { word: "Luminous", definition: "Full of light; shining brightly", part_of_speech: "adjective" },
  { word: "Ethereal", definition: "Extremely delicate and light; heavenly", part_of_speech: "adjective" },
  { word: "Captivating", definition: "Attracting and holding attention", part_of_speech: "adjective" },
  { word: "Enchanting", definition: "Delightfully charming or attractive", part_of_speech: "adjective" },
  { word: "Alluring", definition: "Powerfully and mysteriously attractive", part_of_speech: "adjective" },
  { word: "Mesmerizing", definition: "Capturing complete attention; spellbinding", part_of_speech: "adjective" },
  { word: "Tantalizing", definition: "Tempting but just out of reach", part_of_speech: "adjective" },
  { word: "Scintillating", definition: "Sparkling or shining brightly; brilliant", part_of_speech: "adjective" },
  { word: "Beguiling", definition: "Charming or enchanting, sometimes in a deceptive way", part_of_speech: "adjective" },
  { word: "Irresistible", definition: "Too attractive to be resisted", part_of_speech: "adjective" },
  { word: "Provocative", definition: "Causing excitement or controversy", part_of_speech: "adjective" },
  { word: "Intoxicating", definition: "Extremely exciting or exhilarating", part_of_speech: "adjective" },
  { word: "Enigmatic", definition: "Mysterious and difficult to understand", part_of_speech: "adjective" },
  { word: "Ravishing", definition: "Extremely beautiful; stunning", part_of_speech: "adjective" },
  { word: "Sultry", definition: "Hot and humid; passionate or sensual", part_of_speech: "adjective" },
  { word: "Enthralling", definition: "Capturing and holding attention completely", part_of_speech: "adjective" },
  { word: "Bewitching", definition: "Enchanting or fascinating", part_of_speech: "adjective" },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the effective game date (10pm reset)
    const now = new Date();
    const hours = now.getUTCHours(); // Edge functions run in UTC
    // Note: We use the same 10pm logic but need to account for server timezone
    // Using a simple approach: if hours >= 22 UTC, use tomorrow
    let today: string;
    if (hours >= 22) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      today = tomorrow.toISOString().split('T')[0];
    } else {
      today = now.toISOString().split('T')[0];
    }
    
    // Check if we already have a word for today
    const { data: existingWord, error: fetchError } = await supabase
      .from('gamification_daily_words')
      .select('*')
      .eq('date', today)
      .maybeSingle();
    
    if (fetchError) {
      throw fetchError;
    }
    
    if (existingWord) {
      // Return existing word for today
      return new Response(
        JSON.stringify(existingWord),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate a new word for today
    // Use date-based seed for consistent selection across calls
    const dateHash = today.split('-').join('');
    const index = parseInt(dateHash) % WORD_LIST.length;
    const selectedWord = WORD_LIST[index];
    
    // Insert the new word
    const { data: newWord, error: insertError } = await supabase
      .from('gamification_daily_words')
      .insert({
        word: selectedWord.word,
        definition: selectedWord.definition,
        part_of_speech: selectedWord.part_of_speech,
        date: today
      })
      .select()
      .single();
    
    if (insertError) {
      // If insert fails (race condition), try to fetch again
      const { data: retryWord } = await supabase
        .from('gamification_daily_words')
        .select('*')
        .eq('date', today)
        .single();
      
      if (retryWord) {
        return new Response(
          JSON.stringify(retryWord),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw insertError;
    }
    
    return new Response(
      JSON.stringify(newWord),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in word-of-the-day:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
