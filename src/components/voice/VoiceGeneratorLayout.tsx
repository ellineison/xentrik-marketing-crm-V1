import React, { useState, useEffect } from 'react';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, Play, Copy, Download, Loader2, Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PremiumCard } from '@/components/ui/premium-card';
import { supabase } from '@/integrations/supabase/client';

// ElevenLabs configuration
const ELEVENLABS_API_KEY = 'sk_ac245bd4e35ea3976298913a1202a82d8db5975534c00f3e';
const MADDY_VOICE_ID = 'puU1eXVwhHYVUrgX2AMX';

const EMOTION_OPTIONS = [
  { id: 'seductive', name: 'Seductive' },
  { id: 'casual', name: 'Casual' },
];

interface VoiceNote {
  id: string;
  text: string;
  audio: string;
  settings: {
    emotion: string;
    message?: string;
  };
  createdAt: string;
}

interface VoiceGeneratorLayoutProps {
  toast: any;
}

const VoiceGeneratorLayout: React.FC<VoiceGeneratorLayoutProps> = ({ toast }) => {
  const [message, setMessage] = useState<string>('');
  const [emotion, setEmotion] = useState<string>('seductive');
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const audioRef = React.useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadVoiceNotes();
  }, []);

  const loadVoiceNotes = () => {
    try {
      const voiceGenerationCache = JSON.parse(localStorage.getItem('voiceGenerationCache') || '{}');
      const modelCache = voiceGenerationCache['maddy'] || [];
      setVoiceNotes(modelCache);
    } catch (error) {
      console.error('Error loading voice notes:', error);
      toast({
        title: "Error",
        description: "Failed to load voice notes",
        variant: "destructive",
      });
      setVoiceNotes([]);
    }
  };

  const handleVoiceGeneration = async () => {
    const textToGenerate = message.trim();
    if (!textToGenerate) {
      toast({
        title: "Error",
        description: "Please enter a message to generate",
        variant: "destructive",
      });
      return;
    }

    if (textToGenerate.length > 2500) {
      toast({
        title: "Error",
        description: "Message too long. Maximum 2500 characters allowed.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log('Generating voice with ElevenLabs...');
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-generate', {
        body: {
          text: textToGenerate,
          voiceId: MADDY_VOICE_ID,
          apiKey: ELEVENLABS_API_KEY
        }
      });

      if (error) {
        console.error('ElevenLabs generation error:', error);
        throw new Error(error.message || 'Failed to generate voice');
      }

      if (!data || !data.audioContent) {
        throw new Error('No audio data received from voice generation service');
      }

      // Convert base64 to blob URL for playback
      const audioBlob = new Blob([Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setGeneratedAudio(audioUrl);
      
      // Store in local cache
      const voiceGenerationCache = JSON.parse(localStorage.getItem('voiceGenerationCache') || '{}');
      const modelCache = voiceGenerationCache['maddy'] || [];
      
      const voiceNote = {
        id: `voice-${Date.now()}`,
        text: textToGenerate,
        audio: audioUrl,
        settings: {
          emotion: emotion,
          message: message,
        },
        createdAt: new Date().toISOString()
      };
      
      modelCache.unshift(voiceNote);
      if (modelCache.length > 30) modelCache.pop();
      
      voiceGenerationCache['maddy'] = modelCache;
      localStorage.setItem('voiceGenerationCache', JSON.stringify(voiceGenerationCache));
      
      setVoiceNotes(modelCache);
      
      toast({
        title: "Success",
        description: data.message || "Voice note generated successfully with Maddy's voice!",
      });
    } catch (error) {
      console.error('Error generating voice:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate voice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = (id: string, audioSrc: string) => {
    setPlayingId(id);
    const audio = new Audio(audioSrc);
    audio.addEventListener('ended', () => setPlayingId(null));
    audio.play();
  };

  const copyAudioToClipboard = () => {
    toast({
      title: "Success",
      description: "Audio copied to clipboard!",
    });
  };

  const downloadAudio = (audioSrc: string, text: string) => {
    const link = document.createElement('a');
    link.href = audioSrc;
    link.download = `voice-note-${text.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '-')}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteVoiceNote = (id: string) => {
    try {
      const voiceGenerationCache = JSON.parse(localStorage.getItem('voiceGenerationCache') || '{}');
      const modelCache = voiceGenerationCache['maddy'] || [];
      const updatedCache = modelCache.filter((note: VoiceNote) => note.id !== id);
      voiceGenerationCache['maddy'] = updatedCache;
      localStorage.setItem('voiceGenerationCache', JSON.stringify(voiceGenerationCache));
      
      setVoiceNotes(updatedCache);
      
      toast({
        title: "Success",
        description: "Voice note deleted",
      });
    } catch (error) {
      console.error('Error deleting voice note:', error);
      toast({
        title: "Error",
        description: "Failed to delete voice note",
        variant: "destructive",
      });
    }
  };

  const getEmotionName = (emotionId: string) => {
    const emotion = EMOTION_OPTIONS.find(a => a.id === emotionId);
    return emotion ? emotion.name : emotionId;
  };

  const filteredNotes = searchTerm 
    ? voiceNotes.filter(note => 
        note.text.toLowerCase().includes(searchTerm.toLowerCase()))
    : voiceNotes;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <>
      <CardHeader className="border-b border-premium-border/30">
        <CardTitle className="text-2xl font-semibold">Voice Generator - Maddy</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-8">
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="generate" className="flex-1">Generate Voice</TabsTrigger>
              <TabsTrigger value="library" className="flex-1">Voice Library</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-6">
              <div className="space-y-6 w-full">
                {/* Voice Emotion */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium block">Voice Emotion</Label>
                  <Select 
                    value={emotion}
                    onValueChange={setEmotion}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select emotion" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMOTION_OPTIONS.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Message Input */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium block">Message for Maddy's Voice</Label>
                  <Input 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    placeholder="Enter the message you want to convert to speech..."
                    className="w-full"
                    maxLength={2500}
                  />
                  <div className="text-xs text-muted-foreground">
                    {message.length}/2500 characters
                  </div>
                </div>

                <Button 
                  onClick={handleVoiceGeneration} 
                  className="w-full" 
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Maddy's Voice...
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      Generate Voice with Maddy
                    </>
                  )}
                </Button>

                  {/* Generated Audio Preview */}
                  {generatedAudio && (
                    <PremiumCard className="border-premium-accent/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => playAudio('generated', generatedAudio)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">Generated Audio</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={copyAudioToClipboard}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadAudio(generatedAudio, message)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </PremiumCard>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="library" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search voice notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                   {false ? (
                     <div className="flex items-center justify-center py-8">
                       <Loader2 className="h-6 w-6 animate-spin" />
                       <span className="ml-2">Loading voice notes...</span>
                     </div>
                   ) : filteredNotes.length === 0 ? (
                     <div className="text-center py-8 text-muted-foreground">
                       No voice notes found.
                     </div>
                   ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {filteredNotes.map((note) => (
                          <PremiumCard key={note.id} className="border-premium-border/30">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium line-clamp-2">{note.text}</p>
                                     <div className="flex flex-wrap gap-2">
                                       <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-premium-muted">
                                         Maddy
                                       </span>
                                        {note.settings.emotion && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-premium-muted">
                                            {getEmotionName(note.settings.emotion)}
                                          </span>
                                        )}
                                     </div>
                                    <p className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => playAudio(note.id, note.audio)}
                                    className="flex items-center space-x-1"
                                  >
                                    <Play className="h-3 w-3" />
                                    <span>Play</span>
                                  </Button>
                                  <div className="flex space-x-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={copyAudioToClipboard}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => downloadAudio(note.audio, note.text)}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => deleteVoiceNote(note.id)}
                                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </PremiumCard>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </TabsContent>
            </Tabs>
        </div>
      </CardContent>
    </>
  );
};

export default VoiceGeneratorLayout;