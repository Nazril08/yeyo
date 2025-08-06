import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { 
  Download, 
  Play, 
  Pause,
  Trash2,
  FolderOpen,
  Copy,
  Music,
  Video,
  List,
  Settings,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2
} from 'lucide-react';

interface DownloadItem {
  id: string;
  url: string;
  title?: string;
  thumbnail?: string;
  duration?: number;
  fileSize?: number;
  format: string;
  quality: string;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'paused';
  progress: number;
  speed?: number;
  eta?: number;
  outputPath?: string;
  error?: string;
}

interface VideoInfo {
  title: string;
  duration: number;
  thumbnail: string;
  uploader: string;
  formats: Array<{
    format_id: string;
    ext: string;
    width?: number;
    height?: number;
    filesize?: number;
    vcodec?: string;
    acodec?: string;
    format_note?: string;
  }>;
}

interface DownloadSettings {
  outputDir: string;
  quality: string;
  format: string;
  audioOnly: boolean;
  audioFormat: string;
  embedSubs: boolean;
  embedThumbnail: boolean;
  embedMetadata: boolean;
  maxConcurrent: number;
  retries: number;
  cookieFile: string;
}

const qualityOptions = [
  { value: 'best', label: 'Best Quality' },
  { value: 'worst', label: 'Worst Quality' },
  { value: 'bestvideo+bestaudio/best', label: 'Best Video + Audio' },
  { value: 'bestvideo[height<=?2160]+bestaudio/best', label: '4K (2160p)' },
  { value: 'bestvideo[height<=?1440]+bestaudio/best', label: '2K (1440p)' },
  { value: 'bestvideo[height<=?1080]+bestaudio/best', label: 'Full HD (1080p)' },
  { value: 'bestvideo[height<=?720]+bestaudio/best', label: 'HD (720p)' },
  { value: 'bestvideo[height<=?480]+bestaudio/best', label: 'SD (480p)' },
  { value: 'bestvideo[height<=?360]+bestaudio/best', label: '360p' },
];

const formatOptions = [
  { value: 'mp4', label: 'MP4' },
  { value: 'webm', label: 'WebM' },
  { value: 'mkv', label: 'MKV' },
  { value: 'avi', label: 'AVI' },
  { value: 'mov', label: 'MOV' },
  { value: 'flv', label: 'FLV' },
];

const audioFormatOptions = [
  { value: 'mp3', label: 'MP3' },
  { value: 'aac', label: 'AAC' },
  { value: 'flac', label: 'FLAC' },
  { value: 'wav', label: 'WAV' },
  { value: 'opus', label: 'Opus' },
  { value: 'vorbis', label: 'Vorbis' },
  { value: 'm4a', label: 'M4A' },
];

export default function DownloadManager() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  
  const [settings, setSettings] = useState<DownloadSettings>({
    outputDir: '',
    quality: 'bestvideo[height<=?1080]+bestaudio/best',
    format: 'mp4',
    audioOnly: false,
    audioFormat: 'mp3',
    embedSubs: true,
    embedThumbnail: true,
    embedMetadata: true,
    maxConcurrent: 3,
    retries: 3,
    cookieFile: ''
  });

  const urlInputRef = useRef<HTMLInputElement>(null);

  // Get video information
  const getVideoInfo = useCallback(async (url: string) => {
    if (!url.trim()) return;

    setIsLoadingInfo(true);
    setError('');
    setVideoInfo(null);

    try {
      const info = await invoke<VideoInfo>('get_video_info', { url: url.trim() });
      setVideoInfo(info);
    } catch (err) {
      console.error('Error getting video info:', err);
      setError(`Failed to get video info: ${err}`);
    } finally {
      setIsLoadingInfo(false);
    }
  }, []);

  // Handle URL input change
  const handleUrlChange = useCallback((url: string) => {
    setCurrentUrl(url);
    if (url.trim()) {
      // Debounce the API call
      const timer = setTimeout(() => {
        getVideoInfo(url);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [getVideoInfo]);

  // Add single download
  const addDownload = useCallback(async () => {
    if (!currentUrl.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    const downloadId = Math.random().toString(36).substr(2, 9);
    const newDownload: DownloadItem = {
      id: downloadId,
      url: currentUrl.trim(),
      title: videoInfo?.title || 'Unknown',
      thumbnail: videoInfo?.thumbnail,
      duration: videoInfo?.duration,
      format: settings.audioOnly ? settings.audioFormat : settings.format,
      quality: settings.quality,
      status: 'pending',
      progress: 0
    };

    setDownloads(prev => [...prev, newDownload]);
    setCurrentUrl('');
    setVideoInfo(null);
    setSuccess('Download added to queue');

    // Start download
    startDownload(newDownload);
  }, [currentUrl, videoInfo, settings]);

  // Add batch downloads
  const addBatchDownloads = useCallback(() => {
    const urls = batchUrls.split('\n').filter(url => url.trim());
    if (urls.length === 0) {
      setError('Please enter at least one URL');
      return;
    }

    const newDownloads: DownloadItem[] = urls.map(url => ({
      id: Math.random().toString(36).substr(2, 9),
      url: url.trim(),
      title: 'Loading...',
      format: settings.audioOnly ? settings.audioFormat : settings.format,
      quality: settings.quality,
      status: 'pending' as const,
      progress: 0
    }));

    setDownloads(prev => [...prev, ...newDownloads]);
    setBatchUrls('');
    setSuccess(`Added ${newDownloads.length} downloads to queue`);

    // Start downloads
    newDownloads.forEach(download => {
      setTimeout(() => startDownload(download), Math.random() * 2000);
    });
  }, [batchUrls, settings]);

  // Start download
  const startDownload = useCallback(async (download: DownloadItem) => {
    try {
      // Update status to downloading
      setDownloads(prev => prev.map(d => 
        d.id === download.id ? { ...d, status: 'downloading' as const } : d
      ));

      const downloadOptions = {
        url: download.url,
        output_dir: settings.outputDir,
        quality: download.quality,
        format: download.format,
        audio_only: settings.audioOnly,
        audio_format: settings.audioFormat,
        embed_subs: settings.embedSubs,
        embed_thumbnail: settings.embedThumbnail,
        embed_metadata: settings.embedMetadata,
        retries: settings.retries,
        cookie_file: settings.cookieFile || null
      };

      const result = await invoke<string>('download_video', { options: downloadOptions });

      // Update status to completed
      setDownloads(prev => prev.map(d => 
        d.id === download.id ? { 
          ...d, 
          status: 'completed' as const, 
          progress: 100,
          outputPath: result 
        } : d
      ));

    } catch (err) {
      console.error('Download error:', err);
      setDownloads(prev => prev.map(d => 
        d.id === download.id ? { 
          ...d, 
          status: 'error' as const, 
          error: String(err) 
        } : d
      ));
    }
  }, [settings]);

  // Remove download
  const removeDownload = useCallback((id: string) => {
    setDownloads(prev => prev.filter(d => d.id !== id));
  }, []);

  // Clear completed downloads
  const clearCompleted = useCallback(() => {
    setDownloads(prev => prev.filter(d => d.status !== 'completed'));
  }, []);

  // Select output directory
  const selectOutputDirectory = useCallback(async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === 'string') {
        setSettings(prev => ({ ...prev, outputDir: selected }));
      }
    } catch (error) {
      console.error('Error selecting output directory:', error);
    }
  }, []);

  // Select cookie file
  const selectCookieFile = useCallback(async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Cookie Files',
          extensions: ['txt', 'cookies']
        }]
      });

      if (selected && typeof selected === 'string') {
        setSettings(prev => ({ ...prev, cookieFile: selected }));
      }
    } catch (error) {
      console.error('Error selecting cookie file:', error);
    }
  }, []);

  // Open file location
  const openFileLocation = useCallback(async (outputPath: string) => {
    try {
      await invoke('open_file_location', { filePath: outputPath });
    } catch (error) {
      console.error('Error opening file location:', error);
    }
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Format duration
  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }, []);

  // Get status icon
  const getStatusIcon = useCallback((status: DownloadItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'downloading':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Download Manager</h2>
        <p className="text-muted-foreground">
          Download videos and audio from 1000+ websites using yt-dlp
        </p>
      </div>

      <Tabs defaultValue="single" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="single">Single URL</TabsTrigger>
          <TabsTrigger value="batch">Batch Download</TabsTrigger>
          <TabsTrigger value="queue">Download Queue</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Add Download
              </CardTitle>
              <CardDescription>
                Enter a URL from YouTube, Twitter, Instagram, TikTok, or any supported site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Video/Audio URL</Label>
                <div className="flex gap-2">
                  <Input
                    ref={urlInputRef}
                    id="url"
                    value={currentUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1"
                  />
                  <Button 
                    onClick={addDownload} 
                    disabled={!currentUrl.trim() || isLoadingInfo}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              {isLoadingInfo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading video information...
                </div>
              )}

              {videoInfo && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {videoInfo.thumbnail && (
                        <img 
                          src={videoInfo.thumbnail} 
                          alt={videoInfo.title}
                          className="w-32 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{videoInfo.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {videoInfo.uploader}
                        </p>
                        {videoInfo.duration && (
                          <p className="text-sm text-muted-foreground">
                            Duration: {formatDuration(videoInfo.duration)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quality</Label>
                  <Select 
                    value={settings.quality} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, quality: value }))}
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

                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select 
                    value={settings.audioOnly ? settings.audioFormat : settings.format} 
                    onValueChange={(value) => {
                      if (settings.audioOnly) {
                        setSettings(prev => ({ ...prev, audioFormat: value }));
                      } else {
                        setSettings(prev => ({ ...prev, format: value }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(settings.audioOnly ? audioFormatOptions : formatOptions).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="audio-only"
                  checked={settings.audioOnly}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, audioOnly: checked }))
                  }
                />
                <Label htmlFor="audio-only" className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Audio Only
                </Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="w-5 h-5" />
                Batch Download
              </CardTitle>
              <CardDescription>
                Add multiple URLs, one per line
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch-urls">URLs (one per line)</Label>
                <Textarea
                  id="batch-urls"
                  value={batchUrls}
                  onChange={(e) => setBatchUrls(e.target.value)}
                  placeholder={`https://www.youtube.com/watch?v=...
https://twitter.com/user/status/...
https://www.instagram.com/p/...`}
                  rows={8}
                />
              </div>

              <Button 
                onClick={addBatchDownloads} 
                disabled={!batchUrls.trim()}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Add All Downloads
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5" />
                  Download Queue ({downloads.length})
                </div>
                <Button 
                  onClick={clearCompleted} 
                  variant="outline" 
                  size="sm"
                  disabled={downloads.filter(d => d.status === 'completed').length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Completed
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {downloads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No downloads in queue
                </div>
              ) : (
                <div className="space-y-3">
                  {downloads.map((download) => (
                    <div key={download.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {download.thumbnail && (
                            <img 
                              src={download.thumbnail} 
                              alt={download.title}
                              className="w-16 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{download.title}</h4>
                            <p className="text-sm text-muted-foreground truncate">{download.url}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{download.format.toUpperCase()}</Badge>
                              <Badge variant="outline">{download.quality}</Badge>
                              {download.duration && (
                                <span className="text-xs text-muted-foreground">
                                  {formatDuration(download.duration)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(download.status)}
                            <span className="text-sm capitalize">{download.status}</span>
                          </div>
                          
                          {download.status === 'completed' && download.outputPath && (
                            <Button
                              onClick={() => openFileLocation(download.outputPath!)}
                              variant="outline"
                              size="sm"
                            >
                              <FolderOpen className="w-4 h-4" />
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => removeDownload(download.id)}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {download.status === 'downloading' && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Downloading...</span>
                            <span>{download.progress}%</span>
                          </div>
                          <Progress value={download.progress} className="w-full" />
                        </div>
                      )}

                      {download.status === 'error' && download.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription>{download.error}</AlertDescription>
                        </Alert>
                      )}

                      {download.status === 'completed' && download.outputPath && (
                        <Alert>
                          <CheckCircle className="w-4 h-4" />
                          <AlertDescription>
                            Downloaded to: {download.outputPath.split('\\').pop()}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Download Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Output Directory</Label>
                <div className="flex gap-2">
                  <Input 
                    value={settings.outputDir} 
                    placeholder="Default download directory"
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={selectOutputDirectory} variant="outline">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Concurrent Downloads</Label>
                  <Select 
                    value={settings.maxConcurrent.toString()} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, maxConcurrent: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Retry Attempts</Label>
                  <Select 
                    value={settings.retries.toString()} 
                    onValueChange={(value) => setSettings(prev => ({ ...prev, retries: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Post-processing Options</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="embed-subs"
                      checked={settings.embedSubs}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, embedSubs: checked }))
                      }
                    />
                    <Label htmlFor="embed-subs">Embed Subtitles</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="embed-thumbnail"
                      checked={settings.embedThumbnail}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, embedThumbnail: checked }))
                      }
                    />
                    <Label htmlFor="embed-thumbnail">Embed Thumbnail</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="embed-metadata"
                      checked={settings.embedMetadata}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, embedMetadata: checked }))
                      }
                    />
                    <Label htmlFor="embed-metadata">Embed Metadata</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Cookie File (Optional)</Label>
                <div className="flex gap-2">
                  <Input 
                    value={settings.cookieFile} 
                    placeholder="Select cookie file for authenticated downloads"
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={selectCookieFile} variant="outline">
                    Browse
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cookie file helps download private/age-restricted content
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
