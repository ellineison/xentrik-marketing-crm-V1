import React, { useState } from 'react';
import { Creator } from '@/types';
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

const VOICE_TONES = [
  { id: 'normal', name: 'Normal' },
  { id: 'tired', name: 'Tired' },
  { id: 'sexy', name: 'Sexy' },
  { id: 'excited', name: 'Excited' },
  { id: 'whisper', name: 'Whisper' },
  { id: 'casual', name: 'Casual' },
  { id: 'seductive', name: 'Seductive' },
];

const AMBIENCE_OPTIONS = [
  { id: 'none', name: 'None' },
  { id: 'coffee_shop', name: 'Coffee Shop' },
  { id: 'street', name: 'Street Noise' },
  { id: 'nature', name: 'Nature Sounds' },
  { id: 'room', name: 'Room Ambience' },
  { id: 'fan', name: 'Fan Background' },
  { id: 'party', name: 'Party Atmosphere' },
  { id: 'crowd', name: 'Crowd Murmur' },
];

interface VoiceNote {
  id: string;
  text: string;
  audio: string;
  settings: {
    model: string;
    ambience: string;
    aiTone?: string;
    message?: string;
    quality?: number;
  };
  createdAt: string;
}

interface VoiceGeneratorLayoutProps {
  creators: Creator[];
  toast: any;
}

const VoiceGeneratorLayout: React.FC<VoiceGeneratorLayoutProps> = ({ creators, toast }) => {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [aiTone, setAiTone] = useState<string>('normal');
  const [ambience, setAmbience] = useState<string>('none');
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const audioRef = React.useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    if (selectedModel) {
      setIsLoading(true);
      setTimeout(() => {
        loadVoiceNotes(selectedModel);
        setIsLoading(false);
      }, 500);
    } else {
      setVoiceNotes([]);
    }
  }, [selectedModel]);

  const loadVoiceNotes = (modelId: string) => {
    try {
      const voiceGenerationCache = JSON.parse(localStorage.getItem('voiceGenerationCache') || '{}');
      const modelCache = voiceGenerationCache[modelId] || [];
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
    if (!selectedModel) {
      toast({
        title: "Error",
        description: "Please select a model",
        variant: "destructive",
      });
      return;
    }

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
      
      const { data, error } = await supabase.functions.invoke('generate-voice', {
        body: {
          creatorId: selectedModel,
          message: textToGenerate,
          tone: aiTone,
          ambience: ambience
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to generate voice');
      }

      if (!data || !data.audio) {
        throw new Error('No audio data received from voice generation service');
      }

      const audioBase64 = data.audio;
      setGeneratedAudio(audioBase64);
      
      // Store in local cache
      const voiceGenerationCache = JSON.parse(localStorage.getItem('voiceGenerationCache') || '{}');
      const modelCache = voiceGenerationCache[selectedModel] || [];
      
      const voiceNote = {
        id: `voice-${Date.now()}`,
        text: textToGenerate,
        audio: audioBase64,
        settings: {
          model: selectedModel,
          ambience: ambience,
          aiTone: aiTone,
          message: message,
        },
        createdAt: new Date().toISOString()
      };
      
      modelCache.unshift(voiceNote);
      if (modelCache.length > 30) modelCache.pop();
      
      voiceGenerationCache[selectedModel] = modelCache;
      localStorage.setItem('voiceGenerationCache', JSON.stringify(voiceGenerationCache));
      
      setVoiceNotes(modelCache);
      
      toast({
        title: "Success",
        description: `Voice note generated successfully! Cost: $${data.cost?.toFixed(4) || '0.0000'}`,
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
      const modelCache = voiceGenerationCache[selectedModel] || [];
      const updatedCache = modelCache.filter((note: VoiceNote) => note.id !== id);
      voiceGenerationCache[selectedModel] = updatedCache;
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

  const getAiToneName = (aiToneId: string) => {
    const tone = VOICE_TONES.find(t => t.id === aiToneId);
    return tone ? tone.name : aiToneId;
  };

  const getAmbienceName = (ambienceId: string) => {
    const ambience = AMBIENCE_OPTIONS.find(a => a.id === ambienceId);
    return ambience ? ambience.name : ambienceId;
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
        <CardTitle className="text-2xl font-semibold">Voice Generator</CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-8">
          {/* Step 1: Model Selection */}
          <div className="w-full">
            <Label className="text-sm font-medium block">Step 1: Select Model</Label>
            <Select 
              value={selectedModel} 
              onValueChange={setSelectedModel}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a model" />
              </SelectTrigger>
              <SelectContent>
                {creators.map(creator => (
                  <SelectItem key={creator.id} value={creator.id}>
                    {creator.name} Model
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedModel && (
            <Tabs defaultValue="generate" className="w-full">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="generate" className="flex-1">Generate Voice</TabsTrigger>
                <TabsTrigger value="library" className="flex-1">Voice Library</TabsTrigger>
              </TabsList>

              <TabsContent value="generate" className="space-y-6">
                <div className="space-y-6 w-full">
                  {/* Step 2: AI Tone Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium block">Step 2: AI Tone</Label>
                      <Select 
                        value={aiTone}
                        onValueChange={setAiTone}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select AI tone" />
                        </SelectTrigger>
                        <SelectContent>
                          {VOICE_TONES.map(tone => (
                            <SelectItem key={tone.id} value={tone.id}>
                              {tone.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium block">Background Ambience</Label>
                      <Select 
                        value={ambience}
                        onValueChange={setAmbience}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ambience" />
                        </SelectTrigger>
                        <SelectContent>
                          {AMBIENCE_OPTIONS.map(option => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Step 3: Message Input */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium block">Step 3: Message for AI Voice</Label>
                    <Input 
                      value={message} 
                      onChange={(e) => setMessage(e.target.value)} 
                      placeholder="Enter the message you want to generate in AI voice..."
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
                        Generating...
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" />
                        Generate Voice
                      </>
                    )}
                  </Button>

                  <div className="w-full">
                    {generatedAudio && !isGenerating ? (
                      <PremiumCard className="h-full flex flex-col">
                        <div className="p-5 flex-1">
                          <h3 className="font-semibold mb-4 text-lg">Preview Generated Voice Note</h3>
                          <ScrollArea className="h-[160px] w-full">
                            <p className="text-sm text-muted-foreground mb-4">{message}</p>
                          </ScrollArea>
                          
                          <div className="flex flex-col gap-3">
                            <Button onClick={() => playAudio("preview", generatedAudio)} variant="outline" className="w-full">
                              <Play className="mr-2 h-4 w-4" />
                              {playingId === "preview" ? "Playing..." : "Play"}
                            </Button>
                            <Button onClick={copyAudioToClipboard} variant="outline" className="w-full">
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </Button>
                            <Button onClick={() => downloadAudio(generatedAudio, message)} variant="outline" className="w-full">
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </Button>
                          </div>
                          
                          <audio ref={audioRef} src={generatedAudio} className="hidden" />
                        </div>
                      </PremiumCard>
                    ) : (
                      <div className="h-full flex items-center justify-center p-6 border border-dashed border-premium-border/30 rounded-xl bg-accent/5 text-muted-foreground">
                        {isGenerating ? (
                          <div className="text-center">
                            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                            <p>Generating voice note with ElevenLabs...</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Follow the steps above to generate a voice note</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="library" className="space-y-6">
                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium block">Search Voice Notes</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by content..."
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : filteredNotes.length > 0 ? (
                      <ScrollArea className="h-[400px]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredNotes.map((note) => (
                            <PremiumCard key={note.id} className="transition-all hover:shadow-md">
                              <div className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="w-4/5">
                                    <p className="line-clamp-2 text-sm font-medium mb-2">{note.text}</p>
                                    {note.settings.message && note.settings.message !== note.text && (
                                      <p className="text-xs text-muted-foreground mb-2">
                                        Original message: {note.settings.message}
                                      </p>
                                    )}
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => deleteVoiceNote(note.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                                
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Model: {creators.find(c => c.id === note.settings.model)?.name || 'Unknown'}</span>
                                    <span>Ambience: {getAmbienceName(note.settings.ambience)}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    <span>AI Tone: {getAiToneName(note.settings.aiTone || 'normal')}</span>
                                  </div>
                                </div>
                                
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(note.createdAt)}
                                </p>
                                
                                <div className="flex flex-wrap gap-2 mt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => playAudio(note.id, note.audio)}
                                    className="flex-1"
                                  >
                                    {playingId === note.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    ) : (
                                      <Play className="h-4 w-4 mr-1" />
                                    )}
                                    {playingId === note.id ? "Playing" : "Play"}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => copyAudioToClipboard()}
                                    className="flex-1"
                                  >
                                    <Copy className="h-4 w-4 mr-1" />
                                    Copy
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => downloadAudio(note.audio, note.text)}
                                    className="flex-1"
                                  >
                                    <Download className="h-4 w-4 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </PremiumCard>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-12 bg-accent/5 rounded-xl border border-dashed border-premium-border/30">
                        <p className="text-muted-foreground">No voice notes found for this model.</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Generate some voice notes in the "Generate Voice" tab.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
    </>
  );
};

export default VoiceGeneratorLayout;
