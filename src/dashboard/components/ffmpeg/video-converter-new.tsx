import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { 
  Loader2, 
  Upload, 
  Download, 
  Settings, 
  Video, 
  FileVideo,
  Trash2,
  Plus,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface ConversionPreset {
  id: string;
  name: string;
  description: string;
  outputFormat: string;
  videoCodec: string;
  audioCodec: string;
  quality: 'fast' | 'balanced' | 'high';
  category: 'web' | 'quality' | 'compressed' | 'legacy';
  settings: {
    crf?: number;
    bitrate?: string;
    preset?: string;
    profile?: string;
  };
}

interface ConversionJob {
  id: string;
  inputPath: string;
  outputPath: string;
  preset: ConversionPreset;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface VideoInfo {
  width: number;
  height: number;
  duration: number;
  fps: number;
  codec: string;
  bitrate: number;
  format: string;
  size: number;
}

export default function VideoConverter() {
  const [conversionJobs, setConversionJobs] = useState<ConversionJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('mp4-h264-balanced');
  const [customSettings, setCustomSettings] = useState(false);
  const [outputDirectory, setOutputDirectory] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Custom settings
  const [customCodec, setCustomCodec] = useState('libx264');
  const [customQuality, setCustomQuality] = useState([23]);
  const [customPreset, setCustomPreset] = useState('medium');
  const [customBitrate, setCustomBitrate] = useState('');
  const [fastMode, setFastMode] = useState(false);

  const conversionPresets: ConversionPreset[] = [
    // Web Optimized
    {
      id: 'mp4-h264-balanced',
      name: 'MP4 H.264 (Balanced)',
      description: 'Best balance of quality and file size for web',
      outputFormat: 'mp4',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      quality: 'balanced',
      category: 'web',
      settings: { crf: 23, preset: 'medium' }
    },
    {
      id: 'mp4-h264-fast',
      name: 'MP4 H.264 (Fast)',
      description: 'Quick conversion with good quality',
      outputFormat: 'mp4',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      quality: 'fast',
      category: 'web',
      settings: { crf: 25, preset: 'fast' }
    },
    {
      id: 'webm-vp9',
      name: 'WebM VP9',
      description: 'Modern web format with excellent compression',
      outputFormat: 'webm',
      videoCodec: 'libvpx-vp9',
      audioCodec: 'libopus',
      quality: 'balanced',
      category: 'web',
      settings: { crf: 30, preset: 'medium' }
    },
    // High Quality
    {
      id: 'mp4-h265-high',
      name: 'MP4 H.265 (HEVC)',
      description: 'High efficiency with smaller file sizes',
      outputFormat: 'mp4',
      videoCodec: 'libx265',
      audioCodec: 'aac',
      quality: 'high',
      category: 'quality',
      settings: { crf: 20, preset: 'medium' }
    },
    {
      id: 'mkv-h264-high',
      name: 'MKV H.264 (High Quality)',
      description: 'Maximum quality preservation',
      outputFormat: 'mkv',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      quality: 'high',
      category: 'quality',
      settings: { crf: 18, preset: 'slow' }
    },
    // Compressed
    {
      id: 'mp4-h264-compressed',
      name: 'MP4 H.264 (Compressed)',
      description: 'Smaller file size for limited bandwidth',
      outputFormat: 'mp4',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      quality: 'fast',
      category: 'compressed',
      settings: { crf: 28, preset: 'fast' }
    },
    {
      id: 'webm-vp8',
      name: 'WebM VP8',
      description: 'Legacy web format with good compression',
      outputFormat: 'webm',
      videoCodec: 'libvpx',
      audioCodec: 'libvorbis',
      quality: 'fast',
      category: 'compressed',
      settings: { crf: 32, preset: 'medium' }
    },
    // Legacy
    {
      id: 'avi-xvid',
      name: 'AVI XviD',
      description: 'Legacy format for older devices',
      outputFormat: 'avi',
      videoCodec: 'libxvid',
      audioCodec: 'mp3',
      quality: 'fast',
      category: 'legacy',
      settings: { bitrate: '1500k' }
    },
    {
      id: 'mov-h264',
      name: 'MOV H.264',
      description: 'Apple QuickTime format',
      outputFormat: 'mov',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      quality: 'balanced',
      category: 'legacy',
      settings: { crf: 23, preset: 'medium' }
    }
  ];

  const handleAddFiles = async () => {
    try {
      const files = await open({
        multiple: true,
        filters: [
          {
            name: 'Video Files',
            extensions: ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg', '3gp', 'ts', 'vob']
          }
        ]
      });

      if (files && Array.isArray(files)) {
        const preset = conversionPresets.find(p => p.id === selectedPreset)!;
        
        for (const file of files) {
          const newJob: ConversionJob = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            inputPath: file,
            outputPath: '',
            preset,
            status: 'pending',
            progress: 0
          };
          
          setConversionJobs(prev => [...prev, newJob]);
        }
        setError('');
      }
    } catch (err) {
      console.error('Error selecting files:', err);
      setError('Failed to select files');
    }
  };

  const handleRemoveJob = (jobId: string) => {
    setConversionJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const handleClearCompleted = () => {
    setConversionJobs(prev => prev.filter(job => job.status !== 'completed'));
  };

  const handleClearAll = () => {
    setConversionJobs([]);
  };

  const handleSelectOutputDirectory = async () => {
    try {
      const directory = await open({
        directory: true
      });

      if (directory && typeof directory === 'string') {
        setOutputDirectory(directory);
      }
    } catch (err) {
      console.error('Error selecting directory:', err);
      setError('Failed to select output directory');
    }
  };

  const handleStartConversion = async () => {
    if (conversionJobs.length === 0) {
      setError('Please add files to convert');
      return;
    }

    const pendingJobs = conversionJobs.filter(job => job.status === 'pending');
    if (pendingJobs.length === 0) {
      setError('No pending jobs to process');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');
      setSuccess('');

      for (const job of pendingJobs) {
        // Update job status to processing
        setConversionJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, status: 'processing' as const } : j
        ));

        try {
          const settings = customSettings ? {
            videoCodec: customCodec,
            audioCodec: job.preset.audioCodec,
            crf: customQuality[0],
            preset: customPreset,
            bitrate: customBitrate || undefined,
            fastMode
          } : {
            videoCodec: job.preset.videoCodec,
            audioCodec: job.preset.audioCodec,
            crf: job.preset.settings.crf || undefined,
            preset: job.preset.settings.preset || undefined,
            bitrate: job.preset.settings.bitrate || undefined,
            fastMode: false
          };

          const result = await invoke<string>('convert_video', {
            inputPath: job.inputPath,
            outputFormat: job.preset.outputFormat,
            outputDirectory: outputDirectory || null,
            settings
          });

          // Update job as completed
          setConversionJobs(prev => prev.map(j => 
            j.id === job.id ? { 
              ...j, 
              status: 'completed' as const, 
              progress: 100,
              outputPath: result 
            } : j
          ));

        } catch (err) {
          console.error('Error converting video:', err);
          // Update job as error
          setConversionJobs(prev => prev.map(j => 
            j.id === job.id ? { 
              ...j, 
              status: 'error' as const, 
              error: String(err) 
            } : j
          ));
        }
      }

      setSuccess('Conversion completed!');
    } catch (err) {
      console.error('Error during conversion:', err);
      setError(`Conversion failed: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPresetsByCategory = (category: string) => {
    return conversionPresets.filter(preset => preset.category === category);
  };

  const getStatusColor = (status: ConversionJob['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-500';
      case 'processing': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: ConversionJob['status']) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Video className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Video Converter</h2>
          <p className="text-muted-foreground">Convert videos between different formats and codecs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Conversion Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preset Selection */}
              <Tabs defaultValue="presets" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="presets">Presets</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>

                <TabsContent value="presets" className="space-y-4">
                  <div className="space-y-3">
                    <Label>Web Optimized</Label>
                    <div className="space-y-2">
                      {getPresetsByCategory('web').map((preset) => (
                        <Button
                          key={preset.id}
                          variant={selectedPreset === preset.id ? "default" : "outline"}
                          className="w-full justify-start h-auto p-3"
                          onClick={() => {
                            setSelectedPreset(preset.id);
                            setCustomSettings(false);
                          }}
                        >
                          <div className="text-left">
                            <div className="font-medium">{preset.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {preset.description}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>

                    <Label>High Quality</Label>
                    <div className="space-y-2">
                      {getPresetsByCategory('quality').map((preset) => (
                        <Button
                          key={preset.id}
                          variant={selectedPreset === preset.id ? "default" : "outline"}
                          className="w-full justify-start h-auto p-3"
                          onClick={() => {
                            setSelectedPreset(preset.id);
                            setCustomSettings(false);
                          }}
                        >
                          <div className="text-left">
                            <div className="font-medium">{preset.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {preset.description}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>

                    <Label>Compressed</Label>
                    <div className="space-y-2">
                      {getPresetsByCategory('compressed').map((preset) => (
                        <Button
                          key={preset.id}
                          variant={selectedPreset === preset.id ? "default" : "outline"}
                          className="w-full justify-start h-auto p-3"
                          onClick={() => {
                            setSelectedPreset(preset.id);
                            setCustomSettings(false);
                          }}
                        >
                          <div className="text-left">
                            <div className="font-medium">{preset.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {preset.description}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>

                    <Label>Legacy</Label>
                    <div className="space-y-2">
                      {getPresetsByCategory('legacy').map((preset) => (
                        <Button
                          key={preset.id}
                          variant={selectedPreset === preset.id ? "default" : "outline"}
                          className="w-full justify-start h-auto p-3"
                          onClick={() => {
                            setSelectedPreset(preset.id);
                            setCustomSettings(false);
                          }}
                        >
                          <div className="text-left">
                            <div className="font-medium">{preset.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {preset.description}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Video Codec</Label>
                      <Select value={customCodec} onValueChange={setCustomCodec}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="libx264">H.264 (libx264)</SelectItem>
                          <SelectItem value="libx265">H.265 (libx265)</SelectItem>
                          <SelectItem value="libvpx-vp9">VP9 (libvpx-vp9)</SelectItem>
                          <SelectItem value="libvpx">VP8 (libvpx)</SelectItem>
                          <SelectItem value="libxvid">XviD (libxvid)</SelectItem>
                          <SelectItem value="copy">Copy (no re-encode)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Quality (CRF): {customQuality[0]}</Label>
                      <Slider
                        value={customQuality}
                        onValueChange={(value) => {
                          setCustomQuality(value);
                          setCustomSettings(true);
                        }}
                        min={0}
                        max={51}
                        step={1}
                        className="mt-2"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Lower values = higher quality, larger files
                      </div>
                    </div>

                    <div>
                      <Label>Encoding Preset</Label>
                      <Select value={customPreset} onValueChange={setCustomPreset}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ultrafast">Ultra Fast</SelectItem>
                          <SelectItem value="superfast">Super Fast</SelectItem>
                          <SelectItem value="veryfast">Very Fast</SelectItem>
                          <SelectItem value="faster">Faster</SelectItem>
                          <SelectItem value="fast">Fast</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="slow">Slow</SelectItem>
                          <SelectItem value="slower">Slower</SelectItem>
                          <SelectItem value="veryslow">Very Slow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Bitrate (optional)</Label>
                      <Input
                        value={customBitrate}
                        onChange={(e) => setCustomBitrate(e.target.value)}
                        placeholder="e.g., 2000k, 5M"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="fast-mode"
                        checked={fastMode}
                        onCheckedChange={setFastMode}
                      />
                      <Label htmlFor="fast-mode">Fast container change (no re-encode)</Label>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Output Directory */}
              <div className="space-y-2">
                <Label>Output Directory (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={outputDirectory}
                    placeholder="Use input file directory"
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectOutputDirectory}
                  >
                    Browse
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Add Files
              </CardTitle>
              <CardDescription>
                Select video files to convert
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleAddFiles}
                className="w-full"
                disabled={isProcessing}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Video Files
              </Button>

              {conversionJobs.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearCompleted}
                    disabled={isProcessing}
                  >
                    Clear Completed
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    disabled={isProcessing}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversion Queue */}
          {conversionJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileVideo className="w-4 h-4" />
                    Conversion Queue ({conversionJobs.length})
                  </span>
                  <Button
                    onClick={handleStartConversion}
                    disabled={isProcessing || conversionJobs.filter(j => j.status === 'pending').length === 0}
                    size="sm"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start Conversion
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conversionJobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {job.inputPath.split('\\').pop() || job.inputPath.split('/').pop()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {job.preset.name} → {job.preset.outputFormat.toUpperCase()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`${getStatusColor(job.status)} text-white`}
                          >
                            {getStatusText(job.status)}
                          </Badge>
                          {job.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveJob(job.id)}
                              disabled={isProcessing}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {job.status === 'processing' && (
                        <Progress value={job.progress} className="h-2" />
                      )}
                      
                      {job.status === 'error' && job.error && (
                        <div className="text-sm text-red-600">
                          Error: {job.error}
                        </div>
                      )}
                      
                      {job.status === 'completed' && job.outputPath && (
                        <div className="text-sm text-green-600">
                          Output: {job.outputPath.split('\\').pop() || job.outputPath.split('/').pop()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
