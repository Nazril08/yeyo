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
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { Loader2, Upload, Download, Settings, Monitor, Smartphone, Tv, Laptop } from 'lucide-react';

interface ResolutionPreset {
  name: string;
  width: number;
  height: number;
  icon: React.ReactNode;
  category: 'ultra' | 'hd' | 'standard' | 'mobile';
}

interface VideoInfo {
  width: number;
  height: number;
  duration: number;
  fps: number;
  codec: string;
  bitrate: number;
}

export default function VideoResizer() {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [outputPath, setOutputPath] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Resize settings
  const [customWidth, setCustomWidth] = useState<number>(1920);
  const [customHeight, setCustomHeight] = useState<number>(1080);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [scaleMode, setScaleMode] = useState<'preset' | 'custom' | 'percentage'>('preset');
  const [scalePercentage, setScalePercentage] = useState([100]);
  const [quality, setQuality] = useState([75]);
  const [outputFormat, setOutputFormat] = useState('mp4');

  const resolutionPresets: ResolutionPreset[] = [
    {
      name: '4K UHD',
      width: 3840,
      height: 2160,
      icon: <Monitor className="w-4 h-4" />,
      category: 'ultra'
    },
    {
      name: '2K QHD',
      width: 2560,
      height: 1440,
      icon: <Monitor className="w-4 h-4" />,
      category: 'ultra'
    },
    {
      name: '1080p FHD',
      width: 1920,
      height: 1080,
      icon: <Tv className="w-4 h-4" />,
      category: 'hd'
    },
    {
      name: '720p HD',
      width: 1280,
      height: 720,
      icon: <Laptop className="w-4 h-4" />,
      category: 'hd'
    },
    {
      name: '480p SD',
      width: 854,
      height: 480,
      icon: <Laptop className="w-4 h-4" />,
      category: 'standard'
    },
    {
      name: '360p',
      width: 640,
      height: 360,
      icon: <Smartphone className="w-4 h-4" />,
      category: 'mobile'
    },
    {
      name: '240p',
      width: 426,
      height: 240,
      icon: <Smartphone className="w-4 h-4" />,
      category: 'mobile'
    }
  ];

  const handleFileSelect = async () => {
    try {
      const file = await open({
        filters: [
          {
            name: 'Video Files',
            extensions: ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'm4v']
          }
        ]
      });

      if (file && typeof file === 'string') {
        setSelectedFile(file);
        setError('');
        
        // Get video info
        try {
          const info = await invoke<VideoInfo>('get_video_info', { filePath: file });
          setVideoInfo(info);
          setCustomWidth(info.width);
          setCustomHeight(info.height);
        } catch (err) {
          console.error('Error getting video info:', err);
          setError('Failed to get video information');
        }
      }
    } catch (err) {
      console.error('Error selecting file:', err);
      setError('Failed to select file');
    }
  };

  const handlePresetSelect = (preset: ResolutionPreset) => {
    setSelectedPreset(preset.name);
    setCustomWidth(preset.width);
    setCustomHeight(preset.height);
    setScaleMode('preset');
  };

  const handleCustomWidthChange = (width: number) => {
    setCustomWidth(width);
    if (maintainAspectRatio && videoInfo) {
      const ratio = videoInfo.width / videoInfo.height;
      setCustomHeight(Math.round(width / ratio));
    }
    setSelectedPreset('');
    setScaleMode('custom');
  };

  const handleCustomHeightChange = (height: number) => {
    setCustomHeight(height);
    if (maintainAspectRatio && videoInfo) {
      const ratio = videoInfo.width / videoInfo.height;
      setCustomWidth(Math.round(height * ratio));
    }
    setSelectedPreset('');
    setScaleMode('custom');
  };

  const handlePercentageChange = (percentage: number[]) => {
    setScalePercentage(percentage);
    if (videoInfo) {
      const newWidth = Math.round(videoInfo.width * (percentage[0] / 100));
      const newHeight = Math.round(videoInfo.height * (percentage[0] / 100));
      setCustomWidth(newWidth);
      setCustomHeight(newHeight);
    }
    setScaleMode('percentage');
    setSelectedPreset('');
  };

  const handleResize = async () => {
    if (!selectedFile || !videoInfo) {
      setError('Please select a video file first');
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      setError('');
      setSuccess('');

      const result = await invoke<string>('resize_video', {
        inputPath: selectedFile,
        outputWidth: customWidth,
        outputHeight: customHeight,
        maintainAspectRatio,
        quality: quality[0],
        outputFormat
      });

      setOutputPath(result);
      setSuccess(`Video resized successfully! Output: ${result}`);
    } catch (err) {
      console.error('Error resizing video:', err);
      setError(`Failed to resize video: ${err}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const getPresetsByCategory = (category: string) => {
    return resolutionPresets.filter(preset => preset.category === category);
  };

  const calculateOutputSize = () => {
    if (!videoInfo) return null;
    
    const inputSize = videoInfo.width * videoInfo.height;
    const outputSize = customWidth * customHeight;
    const sizeRatio = outputSize / inputSize;
    
    return {
      ratio: sizeRatio,
      percentage: Math.round(sizeRatio * 100),
      megapixels: Math.round(outputSize / 1000000 * 10) / 10
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <Monitor className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Video Resizer</h2>
          <p className="text-muted-foreground">Resize and scale videos to different resolutions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Input Video
              </CardTitle>
              <CardDescription>
                Select a video file to resize
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleFileSelect}
                variant="outline"
                className="w-full"
                disabled={isProcessing}
              >
                <Upload className="w-4 h-4 mr-2" />
                Select Video File
              </Button>

              {selectedFile && (
                <div className="space-y-2">
                  <Label>Selected File:</Label>
                  <p className="text-sm text-muted-foreground truncate">
                    {selectedFile.split('\\').pop() || selectedFile.split('/').pop()}
                  </p>
                  
                  {videoInfo && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label className="text-xs">Resolution</Label>
                        <p className="text-sm font-mono">{videoInfo.width}×{videoInfo.height}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Duration</Label>
                        <p className="text-sm font-mono">{Math.round(videoInfo.duration)}s</p>
                      </div>
                      <div>
                        <Label className="text-xs">FPS</Label>
                        <p className="text-sm font-mono">{videoInfo.fps}</p>
                      </div>
                      <div>
                        <Label className="text-xs">Codec</Label>
                        <p className="text-sm font-mono">{videoInfo.codec}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Output Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Output Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Output Format</Label>
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp4">MP4</SelectItem>
                    <SelectItem value="avi">AVI</SelectItem>
                    <SelectItem value="mov">MOV</SelectItem>
                    <SelectItem value="mkv">MKV</SelectItem>
                    <SelectItem value="webm">WebM</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quality: {quality[0]}%</Label>
                <Slider
                  value={quality}
                  onValueChange={setQuality}
                  min={10}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="maintain-aspect"
                  checked={maintainAspectRatio}
                  onCheckedChange={setMaintainAspectRatio}
                />
                <Label htmlFor="maintain-aspect">Maintain aspect ratio</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resize Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resize Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="presets" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="presets">Presets</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                  <TabsTrigger value="percentage">Percentage</TabsTrigger>
                </TabsList>

                <TabsContent value="presets" className="space-y-4">
                  <div className="space-y-3">
                    <Label>Ultra HD</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {getPresetsByCategory('ultra').map((preset) => (
                        <Button
                          key={preset.name}
                          variant={selectedPreset === preset.name ? "default" : "outline"}
                          className="justify-start h-auto p-3"
                          onClick={() => handlePresetSelect(preset)}
                        >
                          <div className="flex items-center gap-2">
                            {preset.icon}
                            <div className="text-left">
                              <div className="font-medium">{preset.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {preset.width}×{preset.height}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>

                    <Label>HD</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {getPresetsByCategory('hd').map((preset) => (
                        <Button
                          key={preset.name}
                          variant={selectedPreset === preset.name ? "default" : "outline"}
                          className="justify-start h-auto p-3"
                          onClick={() => handlePresetSelect(preset)}
                        >
                          <div className="flex items-center gap-2">
                            {preset.icon}
                            <div className="text-left">
                              <div className="font-medium">{preset.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {preset.width}×{preset.height}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>

                    <Label>Standard & Mobile</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {getPresetsByCategory('standard').concat(getPresetsByCategory('mobile')).map((preset) => (
                        <Button
                          key={preset.name}
                          variant={selectedPreset === preset.name ? "default" : "outline"}
                          className="justify-start h-auto p-3"
                          onClick={() => handlePresetSelect(preset)}
                        >
                          <div className="flex items-center gap-2">
                            {preset.icon}
                            <div className="text-left">
                              <div className="font-medium">{preset.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {preset.width}×{preset.height}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Width</Label>
                      <Input
                        type="number"
                        value={customWidth}
                        onChange={(e) => handleCustomWidthChange(Number(e.target.value))}
                        min="1"
                        max="7680"
                      />
                    </div>
                    <div>
                      <Label>Height</Label>
                      <Input
                        type="number"
                        value={customHeight}
                        onChange={(e) => handleCustomHeightChange(Number(e.target.value))}
                        min="1"
                        max="4320"
                        disabled={maintainAspectRatio}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="percentage" className="space-y-4">
                  <div>
                    <Label>Scale: {scalePercentage[0]}%</Label>
                    <Slider
                      value={scalePercentage}
                      onValueChange={handlePercentageChange}
                      min={10}
                      max={200}
                      step={5}
                      className="mt-2"
                    />
                  </div>
                  
                  {videoInfo && (
                    <div className="text-sm text-muted-foreground">
                      Result: {Math.round(videoInfo.width * (scalePercentage[0] / 100))}×{Math.round(videoInfo.height * (scalePercentage[0] / 100))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Output Preview */}
          {videoInfo && (
            <Card>
              <CardHeader>
                <CardTitle>Output Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <Label>Original</Label>
                    <div className="font-mono text-sm">{videoInfo.width}×{videoInfo.height}</div>
                    <Badge variant="outline">
                      {Math.round(videoInfo.width * videoInfo.height / 1000000 * 10) / 10}MP
                    </Badge>
                  </div>
                  <div className="text-center">
                    <Label>Output</Label>
                    <div className="font-mono text-sm">{customWidth}×{customHeight}</div>
                    <Badge variant="outline">
                      {calculateOutputSize()?.megapixels}MP
                    </Badge>
                  </div>
                </div>
                
                {calculateOutputSize() && (
                  <div className="text-center">
                    <Badge variant={calculateOutputSize()!.ratio > 1 ? "destructive" : "default"}>
                      {calculateOutputSize()!.percentage}% of original size
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Process Button */}
          <Button 
            onClick={handleResize}
            disabled={!selectedFile || isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resizing Video...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Resize Video
              </>
            )}
          </Button>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                Processing... {progress}%
              </p>
            </div>
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
