import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { 
  Loader2, 
  Upload, 
  Download, 
  Settings, 
  Play, 
  Volume2,
  Zap,
  Music
} from 'lucide-react';

interface AudioFile {
  path: string;
  name: string;
  size: number;
  duration?: number;
  format?: string;
}

interface NoiseReductionJob {
  id: string;
  file: AudioFile;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  outputPath?: string;
  error?: string;
}

const noiseReductionPresets = {
  'light': {
    algorithm: 'afftdn',
    nr: 8,
    nf: -30,
    description: 'Light Noise Reduction',
    subtitle: 'Gentle cleanup for good quality audio'
  },
  'medium': {
    algorithm: 'afftdn',
    nr: 12,
    nf: -25,
    description: 'Medium Noise Reduction',
    subtitle: 'Balanced cleanup for most recordings'
  },
  'strong': {
    algorithm: 'afftdn',
    nr: 18,
    nf: -20,
    description: 'Strong Noise Reduction',
    subtitle: 'Aggressive cleanup for noisy recordings'
  },
  'speech': {
    algorithm: 'afftdn+highpass+lowpass',
    nr: 15,
    nf: -22,
    highpass: 80,
    lowpass: 8000,
    description: 'Speech Enhancement',
    subtitle: 'Optimized for voice recordings'
  },
  'music': {
    algorithm: 'afftdn+eq',
    nr: 10,
    nf: -28,
    description: 'Music Enhancement',
    subtitle: 'Preserve musical quality while reducing noise'
  },
  'hum-buzz': {
    algorithm: 'highpass+notch',
    highpass: 60,
    notch: 50,
    description: 'Hum/Buzz Removal',
    subtitle: 'Remove electrical interference and AC hum'
  }
};

export default function NoiseReducer() {
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [jobs, setJobs] = useState<NoiseReductionJob[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('medium');
  const [customMode, setCustomMode] = useState(false);
  const [outputDir, setOutputDir] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Custom settings
  const [customSettings, setCustomSettings] = useState({
    algorithm: 'afftdn',
    noiseReduction: [12],
    noiseFloor: [-25],
    highpassFreq: [80],
    lowpassFreq: [8000],
    enableHighpass: false,
    enableLowpass: false
  });

  const handleFileSelect = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Audio/Video Files',
          extensions: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma', 'mp4', 'avi', 'mkv', 'mov', 'wmv']
        }]
      }) as string[];

      if (selected) {
        const newFiles: AudioFile[] = selected.map(path => ({
          path,
          name: path.split('\\').pop() || path.split('/').pop() || 'Unknown',
          size: 0
        }));
        setFiles(prev => [...prev, ...newFiles]);
        setError('');
      }
    } catch (err) {
      setError('Failed to select files');
    }
  };

  const handleOutputDirSelect = async () => {
    try {
      const selected = await open({
        directory: true
      }) as string;

      if (selected) {
        setOutputDir(selected);
      }
    } catch (err) {
      setError('Failed to select output directory');
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startNoiseReduction = async () => {
    if (files.length === 0) {
      setError('Please select audio files first');
      return;
    }

    if (!outputDir) {
      setError('Please select output directory');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    const settings = customMode ? customSettings : noiseReductionPresets[selectedPreset as keyof typeof noiseReductionPresets];
    const newJobs: NoiseReductionJob[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending' as const,
      progress: 0
    }));

    setJobs(newJobs);

    for (let i = 0; i < newJobs.length; i++) {
      const job = newJobs[i];
      
      try {
        // Update job status to processing
        setJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, status: 'processing' as const } : j
        ));

        const noiseSettings = {
          input_path: job.file.path,
          output_dir: outputDir,
          preset: customMode ? 'custom' : selectedPreset,
          algorithm: settings.algorithm || 'afftdn',
          noise_reduction: customMode ? customSettings.noiseReduction[0] : (settings as any).nr || 12,
          noise_floor: customMode ? customSettings.noiseFloor[0] : (settings as any).nf || -25,
          highpass_freq: customMode && customSettings.enableHighpass ? customSettings.highpassFreq[0] : (settings as any).highpass || null,
          lowpass_freq: customMode && customSettings.enableLowpass ? customSettings.lowpassFreq[0] : (settings as any).lowpass || null,
          notch_freq: (settings as any).notch || null
        };

        const result = await invoke('reduce_noise', { settings: noiseSettings }) as string;

        // Update job status to completed
        setJobs(prev => prev.map(j => 
          j.id === job.id ? { 
            ...j, 
            status: 'completed' as const, 
            progress: 100,
            outputPath: result 
          } : j
        ));

      } catch (err) {
        console.error('Noise reduction error:', err);
        setJobs(prev => prev.map(j => 
          j.id === job.id ? { 
            ...j, 
            status: 'error' as const, 
            error: String(err) 
          } : j
        ));
      }
    }

    setIsProcessing(false);
    const completedJobs = newJobs.filter(j => j.status === 'completed').length;
    if (completedJobs > 0) {
      setSuccess(`Successfully processed ${completedJobs} file(s)`);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setJobs([]);
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Noise Reducer</h2>
        <p className="text-muted-foreground">
          Remove background noise, hum, and enhance audio quality using advanced FFmpeg filters
        </p>
      </div>

      <Tabs defaultValue="presets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
          <TabsTrigger value="batch">Batch Process</TabsTrigger>
        </TabsList>

        <TabsContent value="presets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Noise Reduction Presets
              </CardTitle>
              <CardDescription>
                Choose from optimized presets for different types of audio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(noiseReductionPresets).map(([key, preset]) => (
                  <div 
                    key={key}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedPreset === key ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPreset(key)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{preset.description}</h4>
                      {selectedPreset === key && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{preset.subtitle}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Algorithm: {preset.algorithm}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Output Directory</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={outputDir} 
                      placeholder="Select output directory"
                      readOnly
                    />
                    <Button onClick={handleOutputDirSelect} variant="outline">
                      Browse
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Custom Settings
              </CardTitle>
              <CardDescription>
                Fine-tune noise reduction parameters for advanced control
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={customMode} 
                  onCheckedChange={setCustomMode}
                  id="custom-mode"
                />
                <Label htmlFor="custom-mode">Enable Custom Mode</Label>
              </div>

              {customMode && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Algorithm</Label>
                      <Select 
                        value={customSettings.algorithm} 
                        onValueChange={(value) => setCustomSettings(prev => ({...prev, algorithm: value}))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="afftdn">FFT Denoising (afftdn)</SelectItem>
                          <SelectItem value="anlmdn">Adaptive Non-local Means</SelectItem>
                          <SelectItem value="highpass">High-pass Filter</SelectItem>
                          <SelectItem value="combined">Combined Filters</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Noise Reduction Strength: {customSettings.noiseReduction[0]}</Label>
                      <Slider
                        value={customSettings.noiseReduction}
                        onValueChange={(value) => setCustomSettings(prev => ({...prev, noiseReduction: value}))}
                        max={30}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Gentle (1)</span>
                        <span>Aggressive (30)</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Noise Floor (dB): {customSettings.noiseFloor[0]}</Label>
                      <Slider
                        value={customSettings.noiseFloor}
                        onValueChange={(value) => setCustomSettings(prev => ({...prev, noiseFloor: value}))}
                        max={-5}
                        min={-50}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>-50 dB</span>
                        <span>-5 dB</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={customSettings.enableHighpass}
                            onCheckedChange={(checked) => setCustomSettings(prev => ({...prev, enableHighpass: checked}))}
                            id="enable-highpass"
                          />
                          <Label htmlFor="enable-highpass">High-pass Filter</Label>
                        </div>
                        {customSettings.enableHighpass && (
                          <div className="space-y-2">
                            <Label>Frequency: {customSettings.highpassFreq[0]} Hz</Label>
                            <Slider
                              value={customSettings.highpassFreq}
                              onValueChange={(value) => setCustomSettings(prev => ({...prev, highpassFreq: value}))}
                              max={500}
                              min={20}
                              step={10}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={customSettings.enableLowpass}
                            onCheckedChange={(checked) => setCustomSettings(prev => ({...prev, enableLowpass: checked}))}
                            id="enable-lowpass"
                          />
                          <Label htmlFor="enable-lowpass">Low-pass Filter</Label>
                        </div>
                        {customSettings.enableLowpass && (
                          <div className="space-y-2">
                            <Label>Frequency: {customSettings.lowpassFreq[0]} Hz</Label>
                            <Slider
                              value={customSettings.lowpassFreq}
                              onValueChange={(value) => setCustomSettings(prev => ({...prev, lowpassFreq: value}))}
                              max={20000}
                              min={1000}
                              step={100}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="w-5 h-5" />
                Batch Processing
              </CardTitle>
              <CardDescription>
                Process multiple files with the selected settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={handleFileSelect} variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Add Files
                </Button>
                <Button 
                  onClick={startNoiseReduction} 
                  disabled={isProcessing || files.length === 0}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  {isProcessing ? 'Processing...' : 'Start Noise Reduction'}
                </Button>
                <Button onClick={clearAll} variant="outline">
                  Clear All
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                Current settings: {customMode ? 'Custom' : noiseReductionPresets[selectedPreset as keyof typeof noiseReductionPresets].description}
              </div>
            </CardContent>
          </Card>

          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selected Files ({files.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-muted-foreground">{file.path}</div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => removeFile(index)} 
                        variant="ghost" 
                        size="sm"
                        disabled={isProcessing}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {jobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div key={job.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{job.file.name}</span>
                        <Badge variant={
                          job.status === 'completed' ? 'default' :
                          job.status === 'error' ? 'destructive' :
                          job.status === 'processing' ? 'secondary' : 'outline'
                        }>
                          {job.status}
                        </Badge>
                      </div>
                      {job.status === 'processing' && (
                        <Progress value={job.progress} className="w-full" />
                      )}
                      {job.status === 'error' && job.error && (
                        <p className="text-sm text-destructive">{job.error}</p>
                      )}
                      {job.status === 'completed' && job.outputPath && (
                        <p className="text-sm text-green-600">Saved to: {job.outputPath}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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
