import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play, Download, Upload, Trash2, RefreshCw } from 'lucide-react';
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

interface GroupedSources {
  [modelName: string]: {
    [emotion: string]: VoiceSource[];
  };
}

const VoiceClone: React.FC = () => {
  const { toast } = useToast();
  const { user, isAuthenticated, userRole, userRoles } = useAuth();
  const [voiceSources, setVoiceSources] = useState<VoiceSource[]>([]);
  const [groupedSources, setGroupedSources] = useState<GroupedSources>({});
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  
  // Admin upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingCreators, setIsLoadingCreators] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);

  const emotions = ['sexual', 'angry', 'excited', 'sweet', 'sad', 'conversational'];

  const isAdmin = userProfile?.role === 'Admin' || userProfile?.roles?.includes('Admin');

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchVoiceSources();
      fetchUserProfile();
      fetchCreators(); // Fetch creators for all users to populate model dropdown
    }
  }, [isAuthenticated, user]);

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

      console.log('Setting voice sources:', data.voiceSources);
      console.log('Setting grouped sources:', data.groupedSources);
      
      setVoiceSources(data.voiceSources || []);
      setGroupedSources(data.groupedSources || {});
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

  const handleGenerate = async () => {
    if (!selectedModel || !selectedEmotion || !inputText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a model, emotion, and enter text to generate",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('voice-generate', {
        body: {
          text: inputText.trim(),
          modelName: selectedModel,
          emotion: selectedEmotion
        }
      });

      if (error) throw error;

      setGeneratedAudio(data.audioUrl);
      toast({
        title: "Success",
        description: "Voice generated successfully!",
      });
    } catch (error) {
      console.error('Error generating voice:', error);
      toast({
        title: "Error",
        description: "Failed to generate voice",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = () => {
    if (generatedAudio) {
      const audio = new Audio(generatedAudio);
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        toast({
          title: "Error",
          description: "Failed to play audio",
          variant: "destructive",
        });
      });
    }
  };

  const downloadAudio = () => {
    if (generatedAudio) {
      const link = document.createElement('a');
      link.href = generatedAudio;
      link.download = `voice_${selectedModel}_${selectedEmotion}_${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Admin functions
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

      // Upload file to storage using Supabase client (same as Shared Files)
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
      const fileInput = document.getElementById('voice-file') as HTMLInputElement;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const availableModels = creators.map(creator => creator.model_name || creator.name);
  const availableEmotions = selectedModel ? Object.keys(groupedSources[selectedModel] || {}) : [];

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
            <p>Please log in to access the Voice Clone module.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Voice Cloning</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="generate" className="space-y-6">
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <TabsTrigger value="generate">Voice Generation</TabsTrigger>
              {isAdmin && <TabsTrigger value="admin">Upload Voices</TabsTrigger>}
            </TabsList>

            <TabsContent value="generate" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Select
                     value={selectedModel}
                     onValueChange={(value) => {
                       console.log('Model selected:', value);
                       console.log('Available emotions for model:', Object.keys(groupedSources[value] || {}));
                       setSelectedModel(value);
                       setSelectedEmotion('');
                     }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emotion">Emotion</Label>
                  <Select
                    value={selectedEmotion}
                    onValueChange={setSelectedEmotion}
                    disabled={!selectedModel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an emotion" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableEmotions.map((emotion) => (
                        <SelectItem key={emotion} value={emotion}>
                          {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text">Text to Generate</Label>
                <Textarea
                  id="text"
                  placeholder="Enter the text you want to convert to speech..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isLoading || !selectedModel || !selectedEmotion || !inputText.trim()}
                className="w-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Voice
              </Button>

              {generatedAudio && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Generated Audio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <audio controls className="w-full">
                      <source src={generatedAudio} type="audio/wav" />
                      Your browser does not support the audio element.
                    </audio>
                    
                    <div className="flex gap-2">
                      <Button onClick={playAudio} variant="outline" size="sm">
                        <Play className="mr-2 h-4 w-4" />
                        Play
                      </Button>
                      <Button onClick={downloadAudio} variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin" className="space-y-6">
                {/* Upload Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Upload Voice Source</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-model">Model</Label>
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
                        <Label htmlFor="admin-emotion">Emotion</Label>
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
                        <Label htmlFor="voice-file">Audio File</Label>
                        <Input
                          id="voice-file"
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
                      {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Voice
                    </Button>
                  </CardContent>
                </Card>

                {/* Voice Sources Table */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
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
                            <TableHead>File</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {voiceSources.map((source) => (
                            <TableRow key={source.id}>
                              <TableCell className="font-medium">{source.model_name}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {source.emotion.charAt(0).toUpperCase() + source.emotion.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {source.bucket_key.split('/').pop()}
                              </TableCell>
                              <TableCell>{formatDate(source.created_at)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  onClick={() => handleDelete(source.id)}
                                  variant="destructive"
                                  size="sm"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {voiceSources.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
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
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceClone;