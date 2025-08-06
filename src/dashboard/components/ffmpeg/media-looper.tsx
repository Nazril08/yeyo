import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, RotateCcw, Clock, File, FolderOpen, Settings } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';

interface LoopSettings {
  targetDuration: number; // in seconds
  outputQuality: string;
  useCustomDuration: boolean;
  customHours: number;
  customMinutes: number;
  customSeconds: number;
}

interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
}

export function MediaLooper() {
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [outputDirectory, setOutputDirectory] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [fileDuration, setFileDuration] = useState<number | null>(null);
  const [loopCount, setLoopCount] = useState<number>(0);
  const [settings, setSettings] = useState<LoopSettings>({
    targetDuration: 3600, // 1 hour default
    outputQuality: 'medium',
    useCustomDuration: false,
    customHours: 1,
    customMinutes: 0,
    customSeconds: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Predefined duration options
  const durationOptions = [
    { value: 300, label: '5 minutes' },
    { value: 600, label: '10 minutes' },
    { value: 1800, label: '30 minutes' },
    { value: 3600, label: '1 hour' },
    { value: 7200, label: '2 hours' },
    { value: 18000, label: '5 hours' },
    { value: 36000, label: '10 hours' }
  ];

  const qualityOptions = [
    { value: 'low', label: 'Low Quality (Fast)' },
    { value: 'medium', label: 'Medium Quality' },
    { value: 'high', label: 'High Quality (Slow)' }
  ];

  // Get file duration using Tauri backend
  const getFileDuration = useCallback(async (filePath: string): Promise<number> => {
    try {
      const duration = await invoke<number>('get_media_duration', { filePath });
      return duration;
    } catch (error) {
      console.error('Error getting file duration:', error);
      throw error;
    }
  }, []);

  // Calculate loop count
  const calculateLoopCount = useCallback((duration: number, target: number): number => {
    return Math.ceil(target / duration);
  }, []);

  // Calculate custom duration in seconds
  const getCustomDurationInSeconds = useCallback((hours: number, minutes: number, seconds: number): number => {
    return (hours * 3600) + (minutes * 60) + seconds;
  }, []);

  // Get effective target duration (preset or custom)
  const getEffectiveTargetDuration = useCallback((): number => {
    if (settings.useCustomDuration) {
      return getCustomDurationInSeconds(settings.customHours, settings.customMinutes, settings.customSeconds);
    }
    return settings.targetDuration;
  }, [settings, getCustomDurationInSeconds]);

  // Handle file selection
  const handleFileSelect = async (file: FileInfo) => {
    setSelectedFile(file);
    setResult(null);
    
    try {
      const duration = await getFileDuration(file.path);
      setFileDuration(duration);
      const effectiveTarget = getEffectiveTargetDuration();
      const loops = calculateLoopCount(duration, effectiveTarget);
      setLoopCount(loops);
    } catch (error) {
      console.error('Error getting file duration:', error);
      setFileDuration(null);
      setLoopCount(0);
    }
  };

  // Fallback method for HTML5 file objects (drag & drop)
  const getFileDurationFromFile = useCallback((file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const element = file.type.startsWith('video/') 
        ? document.createElement('video')
        : document.createElement('audio');
      
      element.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(element.duration);
      };
      
      element.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load media file'));
      };
      
      element.src = url;
    });
  }, []);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    // For drag & drop, we'll show a message that user should use file dialog
    // since we need file paths for Tauri backend
    alert('Please use the file selector button instead of drag & drop for now.');
  }, []);

  // File input change handler (using Tauri dialog)
  const handleFileInputChange = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Media Files',
            extensions: ['mp4', 'avi', 'mov', 'mkv', 'mp3', 'wav', 'flac', 'aac', 'gif']
          }
        ]
      });

      if (selected && typeof selected === 'string') {
        // Create a minimal file info object with path
        const fileName = selected.split(/[\\/]/).pop() || 'Unknown';
        const fileInfo: FileInfo = {
          name: fileName,
          path: selected,
          size: 0, // We could get this from backend if needed
          type: getFileType(fileName),
        };
        
        await handleFileSelect(fileInfo);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  };

  // Helper to determine file type from extension
  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['mp4', 'avi', 'mov', 'mkv', 'gif'].includes(ext || '')) {
      return `video/${ext}`;
    } else if (['mp3', 'wav', 'flac', 'aac'].includes(ext || '')) {
      return `audio/${ext}`;
    }
    return 'application/octet-stream';
  };

  // Handle output directory selection
  const handleSelectOutputDirectory = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === 'string') {
        setOutputDirectory(selected);
      }
    } catch (error) {
      console.error('Error selecting output directory:', error);
    }
  };

  // Update loop count when settings change
  React.useEffect(() => {
    if (fileDuration) {
      const effectiveTarget = getEffectiveTargetDuration();
      const loops = calculateLoopCount(fileDuration, effectiveTarget);
      setLoopCount(loops);
    }
  }, [fileDuration, settings, calculateLoopCount, getEffectiveTargetDuration]);

  // Handle generation
  const handleGenerate = async () => {
    if (!selectedFile || !fileDuration) return;

    // Validate custom duration
    const effectiveTarget = getEffectiveTargetDuration();
    if (effectiveTarget <= 0) {
      alert('Please set a valid duration greater than 0');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      // Check if FFmpeg is available first
      const ffmpegAvailable = await invoke<boolean>('check_ffmpeg');
      if (!ffmpegAvailable) {
        throw new Error("FFmpeg is not installed or not found in PATH. Please install FFmpeg and try again.");
      }

      // Call loop_media with selected output directory
      const effectiveTarget = getEffectiveTargetDuration();
      const outputPath = await invoke<string>('loop_media', {
        inputPath: selectedFile.path,
        outputDirectory: outputDirectory, // Use selected directory or empty for same directory as input
        targetDuration: effectiveTarget
      });

      // Set the actual output path returned by backend
      setResult(outputPath);
      setProgress(100);
      alert(`Success: File created at ${outputPath}`);
    } catch (error) {
      console.error('Error generating looped media:', error);
      alert(`Error: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle opening file location
  const handleOpenFolder = async () => {
    if (!result) return;
    
    try {
      await invoke('open_file_location', { filePath: result });
    } catch (error) {
      console.error('Error opening file location:', error);
    }
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? `${minutes}m` : ''}`;
    } else if (minutes > 0) {
      return `${minutes}m${secs > 0 ? `${secs}s` : ''}`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <RotateCcw className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Media Looper</h2>
      </div>

      <div className="text-muted-foreground">
        <p>Create long-duration videos or audio by looping a short file multiple times.</p>
      </div>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Select Media File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => handleFileInputChange()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,audio/*"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isProcessing}
              style={{ display: 'none' }}
            />
            
            {selectedFile ? (
              <div className="space-y-2">
                <File className="w-12 h-12 mx-auto text-green-500" />
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  {fileDuration && ` • ${formatDuration(Math.floor(fileDuration))}`}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="font-medium">Drop your media file here</p>
                <p className="text-sm text-muted-foreground">
                  Supports video, audio, and GIF files
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Loop Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Duration Mode Toggle */}
            <div className="flex items-center space-x-2">
              <Switch
                id="custom-duration"
                checked={settings.useCustomDuration}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, useCustomDuration: checked }))
                }
                disabled={isProcessing}
              />
              <Label htmlFor="custom-duration" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Custom Duration
              </Label>
            </div>

            {!settings.useCustomDuration ? (
              <div className="space-y-2">
                <Label htmlFor="target-duration">Target Duration (Presets)</Label>
                <Select 
                  value={settings.targetDuration.toString()} 
                  onValueChange={(value) => setSettings(prev => ({ ...prev, targetDuration: parseInt(value) }))}
                  disabled={isProcessing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Custom Duration</Label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="custom-hours" className="text-xs">Hours</Label>
                    <Input
                      id="custom-hours"
                      type="text"
                      value={settings.customHours === 0 ? '' : settings.customHours.toString()}
                      onChange={(e) => {
                        const value = e.target.value;
                        const num = value === '' ? 0 : parseInt(value);
                        setSettings(prev => ({ 
                          ...prev, 
                          customHours: isNaN(num) ? 0 : Math.max(0, Math.min(99, num))
                        }));
                      }}
                      disabled={isProcessing}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="custom-minutes" className="text-xs">Minutes</Label>
                    <Input
                      id="custom-minutes"
                      type="text"
                      value={settings.customMinutes === 0 ? '' : settings.customMinutes.toString()}
                      onChange={(e) => {
                        const value = e.target.value;
                        const num = value === '' ? 0 : parseInt(value);
                        setSettings(prev => ({ 
                          ...prev, 
                          customMinutes: isNaN(num) ? 0 : Math.max(0, Math.min(59, num))
                        }));
                      }}
                      disabled={isProcessing}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="custom-seconds" className="text-xs">Seconds</Label>
                    <Input
                      id="custom-seconds"
                      type="text"
                      value={settings.customSeconds === 0 ? '' : settings.customSeconds.toString()}
                      onChange={(e) => {
                        const value = e.target.value;
                        const num = value === '' ? 0 : parseInt(value);
                        setSettings(prev => ({ 
                          ...prev, 
                          customSeconds: isNaN(num) ? 0 : Math.max(0, Math.min(59, num))
                        }));
                      }}
                      disabled={isProcessing}
                      placeholder="0"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: {formatDuration(getEffectiveTargetDuration())}
                </p>
              </div>
            )}

          <div className="space-y-2">
            <Label htmlFor="output-quality">Quality</Label>
            <Select 
              value={settings.outputQuality} 
              onValueChange={(value) => setSettings(prev => ({ ...prev, outputQuality: value }))}
              disabled={isProcessing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {qualityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Output Directory Selection */}
          <div className="space-y-2">
            <Label htmlFor="output-directory">Output Directory</Label>
            <div className="flex gap-2">
              <Input
                value={outputDirectory || 'Same as input file'}
                placeholder="Choose output directory..."
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectOutputDirectory}
                disabled={isProcessing}
                className="px-3"
              >
                <FolderOpen className="w-4 h-4" />
              </Button>
            </div>
            {outputDirectory && (
              <p className="text-xs text-muted-foreground">
                Files will be saved to: {outputDirectory}
              </p>
            )}
          </div>
        </div>

          {fileDuration && loopCount > 0 && (
            <Alert>
              <AlertDescription>
                The file will be looped <strong>{loopCount} times</strong> to reach {formatDuration(getEffectiveTargetDuration())} duration.
                <br />
                Original duration: {formatDuration(Math.floor(fileDuration))}
                {settings.useCustomDuration && (
                  <span className="text-blue-600">
                    <br />Custom duration: {settings.customHours}h {settings.customMinutes}m {settings.customSeconds}s
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            onClick={handleGenerate} 
            disabled={!selectedFile || !fileDuration || isProcessing || getEffectiveTargetDuration() <= 0}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {isProcessing ? 'Generating...' : 'Generate Looped Media'}
          </Button>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {result && (
            <Alert>
              <Download className="w-4 h-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Generation completed! Output: {result.split(/[\\/]/).pop()}</span>
                <Button variant="outline" size="sm" onClick={handleOpenFolder}>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Open Folder
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default MediaLooper;
