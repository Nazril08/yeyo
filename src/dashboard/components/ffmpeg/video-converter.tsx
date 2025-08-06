import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, Settings, Play } from 'lucide-react';

export function VideoConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>('mp4');
  const [quality, setQuality] = useState<string>('medium');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setProgress(0);

    // Simulate conversion progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsConverting(false);
          setResult(`${selectedFile.name.split('.')[0]}_converted.${outputFormat}`);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const formatOptions = [
    { value: 'mp4', label: 'MP4' },
    { value: 'avi', label: 'AVI' },
    { value: 'mov', label: 'MOV' },
    { value: 'mkv', label: 'MKV' },
    { value: 'webm', label: 'WebM' },
    { value: 'flv', label: 'FLV' }
  ];

  const qualityOptions = [
    { value: 'low', label: 'Low (480p)' },
    { value: 'medium', label: 'Medium (720p)' },
    { value: 'high', label: 'High (1080p)' },
    { value: 'ultra', label: 'Ultra (4K)' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
          <Settings className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">FFmpeg Video Converter</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Select Video File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="video-file">Video File</Label>
            <Input
              id="video-file"
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={isConverting}
            />
          </div>

          {selectedFile && (
            <Alert>
              <AlertDescription>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Conversion Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="output-format">Output Format</Label>
              <Select value={outputFormat} onValueChange={setOutputFormat} disabled={isConverting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Select value={quality} onValueChange={setQuality} disabled={isConverting}>
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
          </div>

          <Button 
            onClick={handleConvert} 
            disabled={!selectedFile || isConverting}
            className="w-full"
          >
            <Play className="w-4 h-4 mr-2" />
            {isConverting ? 'Converting...' : 'Start Conversion'}
          </Button>

          {isConverting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Converting...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {result && (
            <Alert>
              <Download className="w-4 h-4" />
              <AlertDescription>
                Conversion completed! Output file: {result}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default VideoConverter;
