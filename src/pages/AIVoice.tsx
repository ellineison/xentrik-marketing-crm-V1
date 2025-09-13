import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, Trash2, RefreshCw, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface VoiceSource {
  id: string;
  model_name: string;
  emotion: string;
  bucket_key: string;
  created_at: string;
  updated_at: string;
}

interface Creator {
  id: string;
  name: string;
  model_name?: string;
}

interface GeneratedVoiceClone {
  id: string;
  bucket_key: string;
  model_name: string;
  emotion: string;
  generated_text: string;
  generated_by: string;
  created_at: string;
  updated_at: string;
  audio_url: string;
  job_id: string;
  status: string;
  profiles?: {
    name: string;
  };
}

// Helper function for polling delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const AIVoice: React.FC = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [voiceSources, setVoiceSources] = useState<VoiceSource[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [generatedVoices, setGeneratedVoices] = useState<GeneratedVoiceClone[]>([]);
  const [isLoadingGenerated, setIsLoadingGenerated] = useState(true);
  
  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isLoadingCreators, setIsLoadingCreators] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Generate voice states
  const [generateModel, setGenerateModel] = useState<string>('');
  const [generateEmotion, setGenerateEmotion] = useState<string>('');
  const [generateText, setGenerateText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  // Filter states
  const [sourceModelFilter, setSourceModelFilter] = useState<string>('all');
  const [generatedModelFilter, setGeneratedModelFilter] = useState<string>('all');

  const emotions = ['sexual', 'angry', 'excited', 'sweet', 'sad', 'conversational'];

  const isAdmin = userProfile?.role === 'Admin' || userProfile?.roles?.includes('Admin');
  const hasAccess = isAdmin || userProfile?.role === 'Chatter' || userProfile?.roles?.includes('Chatter');

  // Get unique models for filtering
  const uniqueSourceModels = [...new Set(voiceSources.map(source => source.model_name))];
  const uniqueGeneratedModels = [...new Set(generatedVoices.map(voice => voice.model_name))];

  // Filter functions
  const filteredVoiceSources = sourceModelFilter === 'all' 
    ? voiceSources 
    : voiceSources.filter(source => source.model_name === sourceModelFilter);

  const filteredGeneratedVoices = generatedModelFilter === 'all'
    ? generatedVoices
    : generatedVoices.filter(voice => voice.model_name === generatedModelFilter);

  // Get models that have voice sources available
  const modelsWithVoiceSources = [...new Set(voiceSources.map(source => source.model_name))];
  
  // Filter creators to only show those with voice sources
  const creatorsWithVoiceSources = creators.filter(creator => 
    modelsWithVoiceSources.includes(creator.model_name || creator.name)
  );

  // Get available emotions for selected model in generate tab
  const availableEmotionsForModel = generateModel 
    ? [...new Set(voiceSources
        .filter(source => source.model_name === generateModel)
        .map(source => source.emotion))]
    : emotions;

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchVoiceSources();
      fetchUserProfile();
      fetchCreators();
      fetchGeneratedVoices();
    }
  }, [isAuthenticated, user]);

  // Clear emotion selection when model changes in generate tab
  useEffect(() => {
    if (generateModel && generateEmotion) {
      const isEmotionAvailable = voiceSources
        .filter(source => source.model_name === generateModel)
        .some(source => source.emotion === generateEmotion);
      
      if (!isEmotionAvailable) {
        setGenerateEmotion('');
      }
    }
  }, [generateModel, voiceSources, generateEmotion]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, roles')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchCreators = async () => {
    try {
      setIsLoadingCreators(true);
      const { data, error } = await supabase
        .from('creators')
        .select('id, name, model_name')
        .order('name');

      if (error) throw error;

      setCreators(data || []);
    } catch (error) {
      console.error('Error fetching creators:', error);
      toast({
        title: "Error",
        description: "Failed to fetch creators",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCreators(false);
    }
  };

  const fetchVoiceSources = async () => {
    try {
      setIsLoadingSources(true);
      console.log('Fetching voice sources...');
      const { data, error } = await supabase.functions.invoke('voice-sources', {
        method: 'GET'
      });

      console.log('Voice sources response:', { data, error });

      if (error) throw error;

      setVoiceSources(data.voiceSources || []);
    } catch (error) {
      console.error('Error fetching voice sources:', error);
      toast({
        title: "Error",
        description: "Failed to fetch voice sources",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSources(false);
    }
  };

  const fetchGeneratedVoices = async () => {
    try {
      setIsLoadingGenerated(true);
      const { data, error } = await supabase
        .from('generated_voice_clones')
        .select(`
          *,
          profiles (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGeneratedVoices((data as any) || []);
    } catch (error) {
      console.error('Error fetching generated voices:', error);
      toast({
        title: "Error",
        description: "Failed to fetch generated voices",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGenerated(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if it's an audio file
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid File",
          description: "Please select an audio file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedModel || !selectedEmotion || !selectedFile) {
      toast({
        title: "Missing Information",
        description: "Please select a model, emotion, and file",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Generate unique filename
      const fileExtension = selectedFile.name.split('.').pop() || 'wav';
      const uniqueId = crypto.randomUUID();
      const bucketKey = `voices/${selectedModel}/${selectedEmotion}/${uniqueId}.${fileExtension}`;

      // Upload file to storage using Supabase client
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voices')
        .upload(bucketKey, selectedFile, {
          contentType: selectedFile.type || 'audio/wav',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      // Insert record into voice_sources table
      const { data: voiceSource, error: dbError } = await supabase
        .from('voice_sources')
        .insert({
          model_name: selectedModel,
          emotion: selectedEmotion,
          bucket_key: bucketKey
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from('voices').remove([bucketKey]);
        throw new Error(`Failed to save voice source: ${dbError.message}`);
      }
      
      toast({
        title: "Success",
        description: "Voice uploaded successfully!",
      });

      // Reset form
      setSelectedModel('');
      setSelectedEmotion('');
      setSelectedFile(null);
      const fileInput = document.getElementById('ai-voice-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Refresh the list
      fetchVoiceSources();
    } catch (error) {
      console.error('Error uploading voice:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload voice",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voice source?')) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('voice-sources', {
        body: { id },
      });

      if (error) {
        throw new Error(error.message || 'Delete failed');
      }

      toast({
        title: "Success",
        description: "Voice source deleted successfully!",
      });

      fetchVoiceSources();
    } catch (error) {
      console.error('Error deleting voice source:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete voice source",
        variant: "destructive",
      });
    }
  };

  // Helper function to create WAV file buffer
  const createWavBuffer = (audioData: Int16Array, sampleRate: number): Uint8Array => {
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
  };

  const handleGenerate = async () => {
    if (!generateModel || !generateEmotion || !generateText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a model, emotion, and enter text to generate",
        variant: "destructive",
      });
      return;
    }

    // Validate that text is not too long (prevent bad requests)
    if (generateText.length > 1000) {
      toast({
        title: "Text Too Long",
        description: "Please limit text to 1000 characters or less",
        variant: "destructive",
      });
      return;
    }

    // Validate that the selected model has the selected emotion available
    const isValidCombination = voiceSources.some(
      source => source.model_name === generateModel && source.emotion === generateEmotion
    );
    
    if (!isValidCombination) {
      toast({
        title: "Invalid Combination",
        description: "The selected model doesn't have the selected emotion available",
        variant: "destructive",
      });
      return;
    }

    // NOTE: move this to a server-side proxy ASAP
    const RUNPOD_API_KEY = "rpa_N0CIJRBITCDLGM19ZVE8DBTOSDT6450CWC6C28GSsl0lao";
    const RUNPOD_BASE = "https://api.runpod.ai/v2/svqhe91xadl9ka"; // Updated endpoint

    try {
      setIsGenerating(true);
      cancelledRef.current = false;

      // 1) Start job (async) - Add validation and better error handling
      const requestBody = {
        input: {
          text: generateText.trim(),
          model_name: generateModel,
          emotion: generateEmotion,
        }
      };

      const startRes = await fetch(`${RUNPOD_BASE}/run`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RUNPOD_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const startRaw = await startRes.text();
      if (!startRes.ok) {
        let errorMessage = `RunPod /run failed: ${startRes.status} ${startRes.statusText}`;
        try {
          const errorJson = JSON.parse(startRaw);
          if (errorJson.error) {
            errorMessage = `RunPod error: ${errorJson.error}`;
          }
        } catch {
          // If not JSON, use the raw response
          errorMessage += ` | ${startRaw.slice(0,500)}`;
        }
        throw new Error(errorMessage);
      }
      let startJson: any = {};
      try { 
        startJson = JSON.parse(startRaw); 
      } catch {
        throw new Error(`Non-JSON response from /run: ${startRaw.slice(0,500)}`);
      }
      const jobId = startJson.id;
      if (!jobId) {
        console.error("Start response:", startJson);
        throw new Error("RunPod did not return a job id");
      }

      setCurrentJobId(jobId);

      // 2) Poll for completion (no total timeout as requested)
      let statusJson: any;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        await sleep(1500);
        
        // Check if job was cancelled
        if (cancelledRef.current) {
          toast({ title: "Cancelled", description: "Voice generation cancelled" });
          return;
        }
        
        const stRes = await fetch(`${RUNPOD_BASE}/status/${jobId}`, {
          headers: { Authorization: `Bearer ${RUNPOD_API_KEY}` },
        });
        const stRaw = await stRes.text();
        if (!stRes.ok) {
          let errorMessage = `RunPod /status failed: ${stRes.status} ${stRes.statusText}`;
          try {
            const errorJson = JSON.parse(stRaw);
            if (errorJson.error) {
              errorMessage = `RunPod status error: ${errorJson.error}`;
            }
          } catch {
            errorMessage += ` | ${stRaw.slice(0,500)}`;
          }
          throw new Error(errorMessage);
        }
        try { 
          statusJson = JSON.parse(stRaw); 
        } catch {
          throw new Error(`Non-JSON response from /status: ${stRaw.slice(0,500)}`);
        }
        const s = statusJson.status;
        if (s === "COMPLETED" || s === "FAILED" || s === "CANCELLED" || s === "TIMED_OUT") break;
      }

      if (statusJson.status !== "COMPLETED") {
        const errMsg = statusJson.error || statusJson.status || "TTS job did not complete";
        toast({ title: "Error", description: `Voice generation failed: ${errMsg}`, variant: "destructive" });
        return;
      }

      // 3) Use handler output (same logic as your working code)
      const output = statusJson.output ?? {};
      if (!output?.success) {
        const msg = output?.error || "TTS failed";
        toast({ title: "Error", description: `Voice generation failed: ${msg}`, variant: "destructive" });
        return;
      }

      if (!output.audio || !Array.isArray(output.audio) || output.audio.length < 2) {
        toast({
          title: "Generated (no audio)",
          description: output.generated_text || "No audio returned by the engine.",
        });
        return;
      }

      const [sampleRate, audioDataArray] = output.audio;
      const audioData = new Int16Array(audioDataArray);
      const wavBuffer = createWavBuffer(audioData, sampleRate);
      const audioBlob = new Blob([wavBuffer], { type: "audio/wav" });

      // Save to Supabase Storage
      const ts = Date.now();
      const filename = `generated_${generateModel}_${generateEmotion}_${ts}.wav`;

      const { error: uploadError } = await supabase.storage
        .from("voices")
        .upload(`generated/${filename}`, audioBlob, {
          contentType: "audio/wav",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("voices")
        .getPublicUrl(`generated/${filename}`);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("User not authenticated");

      const { error: dbError } = await supabase
        .from("generated_voice_clones")
        .insert({
          model_name: generateModel,
          emotion: generateEmotion,
          generated_text: generateText,
          generated_by: user.id,
          bucket_key: `generated/${filename}`,
          audio_url: urlData.publicUrl,
          status: "Success",
        });
      if (dbError) throw dbError;

      toast({ title: "Success", description: "Voice generated and saved!" });

      setGenerateText("");
      setGenerateModel("");
      setGenerateEmotion("");
      fetchGeneratedVoices();

    } catch (err) {
      console.error("Error generating voice:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate voice",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setCurrentJobId(null);
    }
  };

  const handleStop = async () => {
    if (!currentJobId) return;

    const RUNPOD_API_KEY = "rpa_N0CIJRBITCDLGM19ZVE8DBTOSDT6450CWC6C28GSsl0lao";
    const RUNPOD_BASE = "https://api.runpod.ai/v2/svqhe91xadl9ka";

    try {
      await fetch(`${RUNPOD_BASE}/cancel/${currentJobId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RUNPOD_API_KEY}`,
        },
      });
    } catch (error) {
      console.error("Error cancelling job:", error);
    }

    cancelledRef.current = true;
    setCurrentJobId(null);
    setIsGenerating(false);
    toast({ title: "Cancelled", description: "Voice generation stopped" });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoadingSources) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading voice sources...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="text-center py-8">
            <p>Please log in to access the AI Voice module.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="text-center py-8">
            <p>Access denied. You need Admin or Chatter privileges to access this module.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>AI Voice Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate" className="w-full">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <TabsTrigger value="generate">Generate Voice</TabsTrigger>
              {isAdmin && <TabsTrigger value="upload">Upload Voice Source</TabsTrigger>}
              <TabsTrigger value="generated">Generated Voices</TabsTrigger>
            </TabsList>
            
            <TabsContent value="generate" className="space-y-6">
              {/* Generate Voice Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Generate Voice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="generate-model">Model Name</Label>
                      <Select value={generateModel} onValueChange={setGenerateModel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingCreators ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : creatorsWithVoiceSources.length > 0 ? (
                            creatorsWithVoiceSources.map((creator) => (
                              <SelectItem key={creator.id} value={creator.model_name || creator.name}>
                                {creator.model_name || creator.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-models" disabled>
                              No models with voice sources available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="generate-emotion">Emotion</Label>
                      <Select value={generateEmotion} onValueChange={setGenerateEmotion}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an emotion" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableEmotionsForModel.length > 0 ? (
                            availableEmotionsForModel.map((emotion) => (
                              <SelectItem key={emotion} value={emotion}>
                                {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-emotions" disabled>
                              {generateModel ? 'No emotions available for this model' : 'Select a model first'}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="generate-text">Text to Generate</Label>
                    <Textarea
                      id="generate-text"
                      placeholder="Enter the text you want the AI voice to say..."
                      value={generateText}
                      onChange={(e) => setGenerateText(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={isGenerating ? handleStop : handleGenerate}
                    disabled={!isGenerating && (!generateModel || !generateEmotion || !generateText.trim())}
                    className="w-full"
                    variant={isGenerating ? "destructive" : "default"}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Stop Generating
                      </>
                    ) : (
                      <>
                        <Mic className="mr-2 h-4 w-4" />
                        Generate Voice
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              {/* Upload Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Voice Source</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai-model">Model</Label>
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingCreators ? (
                            <SelectItem value="loading" disabled>Loading...</SelectItem>
                          ) : (
                            creators.map((creator) => (
                              <SelectItem key={creator.id} value={creator.model_name || creator.name}>
                                {creator.model_name || creator.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ai-emotion">Emotion</Label>
                      <Select value={selectedEmotion} onValueChange={setSelectedEmotion}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an emotion" />
                        </SelectTrigger>
                        <SelectContent>
                          {emotions.map((emotion) => (
                            <SelectItem key={emotion} value={emotion}>
                              {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ai-voice-file">Audio File</Label>
                      <Input
                        id="ai-voice-file"
                        type="file"
                        accept="audio/*"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || !selectedModel || !selectedEmotion || !selectedFile}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading Voice...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Voice
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Voice Sources Table */}
              <Card>
                <CardHeader>
                  <div className="flex flex-row items-center justify-between">
                    <CardTitle>Voice Sources</CardTitle>
                    <Button
                      onClick={fetchVoiceSources}
                      variant="outline"
                      size="sm"
                      disabled={isLoadingSources}
                    >
                      {isLoadingSources ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="source-model-filter">Filter by Model</Label>
                      <Select value={sourceModelFilter} onValueChange={setSourceModelFilter}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Models</SelectItem>
                          {uniqueSourceModels.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingSources ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading voice sources...</span>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Model</TableHead>
                          <TableHead>Emotion</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVoiceSources.map((source) => (
                          <TableRow key={source.id}>
                            <TableCell className="font-medium">{source.model_name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {source.emotion.charAt(0).toUpperCase() + source.emotion.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(source.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(source.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {filteredVoiceSources.length === 0 && !isLoadingSources && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No voice sources found. Upload your first voice to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="generated" className="space-y-6">
              {/* Generated Voices List */}
              <Card>
                <CardHeader>
                  <div className="flex flex-row items-center justify-between">
                    <CardTitle>Generated Voices</CardTitle>
                    <Button
                      onClick={fetchGeneratedVoices}
                      variant="outline"
                      size="sm"
                      disabled={isLoadingGenerated}
                    >
                      {isLoadingGenerated ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="generated-model-filter">Filter by Model</Label>
                      <Select value={generatedModelFilter} onValueChange={setGeneratedModelFilter}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Models</SelectItem>
                          {uniqueGeneratedModels.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingGenerated ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="ml-2">Loading generated voices...</span>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                           <TableHead>Model</TableHead>
                           <TableHead>Emotion</TableHead>
                           <TableHead>Text</TableHead>
                           <TableHead>Generated By</TableHead>
                           <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                       <TableBody>
                         {filteredGeneratedVoices.map((voice) => (
                          <TableRow key={voice.id}>
                            <TableCell className="font-medium">{voice.model_name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {voice.emotion.charAt(0).toUpperCase() + voice.emotion.slice(1)}
                              </Badge>
                            </TableCell>
                             <TableCell className="max-w-xs truncate">{voice.generated_text}</TableCell>
                             <TableCell>{voice.profiles?.name || 'Unknown User'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                {voice.audio_url && voice.status === 'Success' && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const audio = new Audio(voice.audio_url);
                                        audio.play();
                                      }}
                                    >
                                      Play
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = voice.audio_url;
                                        link.download = `${voice.model_name}_${voice.emotion}_${voice.created_at}.wav`;
                                        link.click();
                                      }}
                                    >
                                      Download
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                         
                         {filteredGeneratedVoices.length === 0 && !isLoadingGenerated && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No generated voices found. Generate your first voice to get started.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIVoice;