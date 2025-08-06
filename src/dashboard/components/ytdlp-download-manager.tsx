import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Download, 
  Video, 
  Music, 
  Folder, 
  Settings, 
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Info,
  AlertCircle,
  X,
  RotateCcw,
  Clock
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';

interface DownloadTask {
  id: string;
  url: string;
  title: string;
  format: string;
  quality: string;
  status: 'pending' | 'downloading' | 'completed' | 'error' | 'paused';
  progress: number;
  size?: string;
  speed?: string;
  eta?: string;
  outputPath?: string;
  error?: string;
}

export default function YtdlpDownloadManager() {
  const [url, setUrl] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [format, setFormat] = useState('mp4');
  const [audioFormat, setAudioFormat] = useState('mp3');
  const [quality, setQuality] = useState('1080p');
  const [audioOnly, setAudioOnly] = useState(false);
  const [subtitles, setSubtitles] = useState(false);
  const [playlist, setPlaylist] = useState(false);
  const [customArgs, setCustomArgs] = useState('');
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState<any>(null);
  const [playlistInfo, setPlaylistInfo] = useState<any>(null);
  const [videoDetails, setVideoDetails] = useState<Map<string, any>>(new Map());
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [formatInfo, setFormatInfo] = useState<string>('');
  const [showFormats, setShowFormats] = useState(false);

  const handleSelectOutputPath = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === 'string') {
        setOutputPath(selected);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      setError('Failed to select output directory');
    }
  };

  const handleGetInfo = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setInfo(null);
    setPlaylistInfo(null);
    setVideoDetails(new Map());
    setSelectedVideos([]);

    try {
      // Check if URL is a playlist
      const isPlaylist = url.includes('list=') || url.includes('playlist?');
      
      if (isPlaylist) {
        const result = await invoke('ytdlp_get_playlist_info', { 
          url: url.trim() 
        });
        setPlaylistInfo(result);
        // Auto-select all videos by default
        const videoIds = (result as any)?.entries?.map((entry: any, index: number) => index.toString()) || [];
        setSelectedVideos(videoIds);

        // Fetch thumbnails for first few videos to improve UX
        const detailsMap = new Map();
        const firstFewVideos = (result as any)?.entries?.slice(0, 5) || [];
        for (const [index, entry] of firstFewVideos.entries()) {
          try {
            const details = await invoke('ytdlp_get_video_details', { 
              videoId: entry.id || entry.url 
            });
            detailsMap.set(index.toString(), details);
          } catch (error) {
            console.error(`Failed to get details for video ${index}:`, error);
          }
        }
        setVideoDetails(detailsMap);
      } else {
        const result = await invoke('ytdlp_get_info', { 
          url: url.trim() 
        });
        setInfo(result);
      }
    } catch (error) {
      console.error('Error getting video info:', error);
      setError(error as string);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    if (!outputPath.trim()) {
      setError('Please select an output directory');
      return;
    }

    // Check if it's a playlist and if any videos are selected
    if (playlistInfo && selectedVideos.length === 0) {
      setError('Please select at least one video from the playlist');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (playlistInfo && selectedVideos.length > 0) {
        // Download selected videos from playlist
        for (const videoIndex of selectedVideos) {
          const entry = playlistInfo.entries[parseInt(videoIndex)];
          if (!entry) continue;

          const taskId = Date.now().toString() + '_' + videoIndex;
          const newTask: DownloadTask = {
            id: taskId,
            url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
            title: entry.title || `Video ${parseInt(videoIndex) + 1}`,
            format: audioOnly ? audioFormat : format,
            quality,
            status: 'pending',
            progress: 0,
            outputPath
          };

          setDownloads(prev => [newTask, ...prev]);

          // Update status to downloading
          setDownloads(prev => prev.map(task => 
            task.id === taskId ? { ...task, status: 'downloading' as const } : task
          ));

          try {
            const result = await invoke('ytdlp_download', {
              url: newTask.url,
              outputPath: outputPath.trim(),
              format: audioOnly ? audioFormat : format,
              quality, // Pass simple quality string
              audioOnly,
              subtitles,
              playlist: false, // Download individual videos, not as playlist
              customArgs: customArgs.trim()
            });

            // Update to completed
            setDownloads(prev => prev.map(task => 
              task.id === taskId ? { 
                ...task, 
                status: 'completed' as const, 
                progress: 100,
                outputPath: result as string
              } : task
            ));
          } catch (error) {
            console.error(`Download error for video ${entry.title}:`, error);
            const errorMessage = error as string;
            
            // Check if it's a YouTube streaming issue that might be resolved with retry
            const isYouTubeStreamingError = errorMessage.includes('SABR streaming') || 
                                           errorMessage.includes('web client https formats') ||
                                           errorMessage.includes('HTTP Error 403');
            
            setDownloads(prev => prev.map(task => 
              task.id === taskId ? { 
                ...task, 
                status: 'error' as const, 
                error: isYouTubeStreamingError 
                  ? 'YouTube streaming error - try clicking Retry' 
                  : errorMessage 
              } : task
            ));
          }
        }
      } else {
        // Single video download
        const taskId = Date.now().toString();
        const newTask: DownloadTask = {
          id: taskId,
          url: url.trim(),
          title: info?.title || 'Unknown Title',
          format: audioOnly ? audioFormat : format,
          quality,
          status: 'pending',
          progress: 0,
          outputPath
        };

        setDownloads(prev => [newTask, ...prev]);

        // Update task status to downloading
        setDownloads(prev => prev.map(task => 
          task.id === taskId ? { ...task, status: 'downloading' as const } : task
        ));

        const result = await invoke('ytdlp_download', {
          url: url.trim(),
          outputPath: outputPath.trim(),
          format: audioOnly ? audioFormat : format,
          quality, // Pass simple quality string
          audioOnly,
          subtitles,
          playlist,
          customArgs: customArgs.trim()
        });

        // Update task status to completed
        setDownloads(prev => prev.map(task => 
          task.id === taskId ? { 
            ...task, 
            status: 'completed' as const, 
            progress: 100,
            outputPath: result as string
          } : task
        ));
      }

      // Clear form
      setUrl('');
      setInfo(null);
      setPlaylistInfo(null);
      setSelectedVideos([]);
      
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error as string;
      
      // Check if it's a YouTube streaming issue
      const isYouTubeStreamingError = errorMessage.includes('SABR streaming') || 
                                     errorMessage.includes('web client https formats') ||
                                     errorMessage.includes('HTTP Error 403');
      
      setError(isYouTubeStreamingError 
        ? 'YouTube streaming error detected. This is a temporary issue - please try again.' 
        : errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryDownload = async (task: DownloadTask) => {
    try {
      setDownloads(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'downloading' as const, error: undefined } : t
      ));

      const result = await invoke('ytdlp_download', {
        url: task.url,
        outputPath: task.outputPath || outputPath,
        format: task.format,
        quality: task.quality,
        audioOnly: task.format !== 'mp4',
        subtitles: false,
        playlist: false,
        customArgs: '' // Reset custom args for retry
      });

      setDownloads(prev => prev.map(t => 
        t.id === task.id ? { 
          ...t, 
          status: 'completed' as const, 
          progress: 100,
          outputPath: result as string,
          error: undefined 
        } : t
      ));
    } catch (error) {
      console.error('Retry download error:', error);
      const errorMessage = error as string;
      
      // Provide more helpful error message for YouTube issues
      const isYouTubeStreamingError = errorMessage.includes('SABR streaming') || 
                                     errorMessage.includes('web client https formats') ||
                                     errorMessage.includes('HTTP Error 403');
      
      setDownloads(prev => prev.map(t => 
        t.id === task.id ? { 
          ...t, 
          status: 'error' as const, 
          error: isYouTubeStreamingError 
            ? 'YouTube streaming error persists. Try again later or use different quality/format.' 
            : errorMessage 
        } : t
      ));
    }
  };

  const handleRemoveTask = (taskId: string) => {
    setDownloads(prev => prev.filter(task => task.id !== taskId));
  };

  const handleClearCompleted = () => {
    setDownloads(prev => prev.filter(task => task.status !== 'completed'));
  };

  const handleShowFormats = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL first');
      return;
    }

    try {
      setIsLoading(true);
      const formats = await invoke('ytdlp_list_formats', { url: url.trim() });
      setFormatInfo(formats as string);
      setShowFormats(true);
    } catch (error) {
      setError('Failed to get format information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAllVideos = () => {
    if (playlistInfo?.entries) {
      const allIds = playlistInfo.entries.map((_: any, index: number) => index.toString());
      setSelectedVideos(allIds);
    }
  };

  const handleDeselectAllVideos = () => {
    setSelectedVideos([]);
  };

  const handleToggleVideo = (index: string) => {
    setSelectedVideos(prev => 
      prev.includes(index) 
        ? prev.filter(id => id !== index)
        : [...prev, index]
    );
  };

  const loadVideoDetails = async (videoId: string, index: string) => {
    if (videoDetails.has(index)) {
      return; // Already loaded
    }

    try {
      const details = await invoke('ytdlp_get_video_details', { 
        videoId: videoId 
      });
      setVideoDetails(prev => new Map(prev).set(index, details));
    } catch (error) {
      console.error(`Failed to get details for video ${index}:`, error);
    }
  };

  const getThumbnailUrl = (entry: any, index: string) => {
    const details = videoDetails.get(index);
    if (details?.thumbnail) {
      return details.thumbnail;
    }
    
    // Fallback to YouTube thumbnail URLs
    if (entry.id) {
      return `https://img.youtube.com/vi/${entry.id}/mqdefault.jpg`;
    }
    
    return null;
  };

  const getStatusIcon = (status: DownloadTask['status']) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'downloading':
        return <Download className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: DownloadTask['status']) => {
    const variants: Record<DownloadTask['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      downloading: 'bg-blue-100 text-blue-800', 
      completed: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800',
      paused: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Download className="h-5 w-5" />
        <h2 className="text-2xl font-bold">yt-dlp Download Manager</h2>
        <Badge className="bg-green-100 text-green-800 text-xs">
          Enhanced Quality Selection
        </Badge>
      </div>

      <Tabs defaultValue="download" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="download">Download</TabsTrigger>
          <TabsTrigger value="queue">Queue ({downloads.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="download" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Download Media
              </CardTitle>
              <CardDescription>
                Download videos and audio from various platforms using yt-dlp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* URL Input */}
              <div className="space-y-2">
                <Label htmlFor="url">Video/Audio URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleGetInfo} 
                    disabled={isLoading || !url.trim()}
                    variant="outline"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Get Info
                  </Button>
                  <Button 
                    onClick={handleShowFormats} 
                    disabled={isLoading || !url.trim()}
                    variant="outline"
                  >
                    <Info className="h-4 w-4 mr-2" />
                    Show Formats
                  </Button>
                </div>
              </div>

              {/* Video/Playlist Info */}
              {info && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p><strong>Title:</strong> {info.title}</p>
                      <p><strong>Duration:</strong> {info.duration ? `${Math.floor(info.duration / 60)}:${(info.duration % 60).toString().padStart(2, '0')}` : 'N/A'}</p>
                      <p><strong>Uploader:</strong> {info.uploader || 'N/A'}</p>
                      {info.view_count && <p><strong>Views:</strong> {info.view_count.toLocaleString()}</p>}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Playlist Info */}
              {playlistInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Playlist Detected ({playlistInfo.playlist_count} videos)</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSelectAllVideos}
                        >
                          Select All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleDeselectAllVideos}
                        >
                          Deselect All
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>
                      Choose which videos to download from the playlist
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {playlistInfo.entries?.map((entry: any, index: number) => {
                        const indexStr = index.toString();
                        const thumbnailUrl = getThumbnailUrl(entry, indexStr);
                        
                        return (
                          <div
                            key={index}
                            className="flex items-start space-x-3 p-3 border rounded hover:bg-muted/50 transition-colors"
                            onMouseEnter={() => {
                              if (entry.id && !videoDetails.has(indexStr)) {
                                loadVideoDetails(entry.id, indexStr);
                              }
                            }}
                          >
                            <Checkbox
                              checked={selectedVideos.includes(indexStr)}
                              onCheckedChange={() => handleToggleVideo(indexStr)}
                              className="mt-1 flex-shrink-0"
                            />
                            
                            {/* Thumbnail */}
                            <div className="w-20 h-14 bg-muted rounded overflow-hidden flex-shrink-0">
                              {thumbnailUrl ? (
                                <img
                                  src={thumbnailUrl}
                                  alt={entry.title || `Video ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    // Fallback if thumbnail fails to load
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <div className={`w-full h-full flex items-center justify-center ${thumbnailUrl ? 'hidden' : ''}`}>
                                <Video className="h-6 w-6 text-muted-foreground" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0 space-y-1">
                              <p 
                                className="text-sm font-medium line-clamp-2 leading-tight" 
                                title={entry.title || `Video ${index + 1}`}
                              >
                                {entry.title || `Video ${index + 1}`}
                              </p>
                              <div className="text-xs text-muted-foreground space-y-0.5">
                                {entry.uploader && (
                                  <p className="truncate" title={`By ${entry.uploader}`}>
                                    By {entry.uploader}
                                  </p>
                                )}
                                <div className="flex items-center gap-2">
                                  {entry.duration && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {Math.floor(entry.duration / 60)}:{(entry.duration % 60).toString().padStart(2, '0')}
                                    </span>
                                  )}
                                  <span className="text-muted-foreground">#{index + 1}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      {selectedVideos.length} of {playlistInfo.playlist_count} videos selected
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Output Path */}
              <div className="space-y-2">
                <Label htmlFor="output-path">Output Directory</Label>
                <div className="flex gap-2">
                  <Input
                    id="output-path"
                    value={outputPath}
                    onChange={(e) => setOutputPath(e.target.value)}
                    placeholder="Select output directory..."
                    readOnly
                  />
                  <Button onClick={handleSelectOutputPath} variant="outline">
                    <Folder className="h-4 w-4 mr-2" />
                    Browse
                  </Button>
                </div>
              </div>

              {/* Format Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Download Type</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="audio-only" 
                      checked={audioOnly}
                      onCheckedChange={(checked) => setAudioOnly(checked as boolean)}
                    />
                    <Label htmlFor="audio-only" className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      Audio Only
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quality">Quality</Label>
                  <Select value={quality} onValueChange={setQuality}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="best">Best Available</SelectItem>
                      <SelectItem value="1080p">1080p (Full HD) - Premium Quality</SelectItem>
                      <SelectItem value="720p">720p (HD) - High Quality</SelectItem>
                      <SelectItem value="480p">480p (SD) - Standard Quality</SelectItem>
                      <SelectItem value="360p">360p - Low Quality</SelectItem>
                      <SelectItem value="worst">Worst Available</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Using advanced format selectors for optimal quality. 1080p will prioritize H.264 codec for better compatibility.
                  </p>
                </div>

              </div>

              {!audioOnly && (
                <div className="space-y-2">
                  <Label htmlFor="format">Video Format</Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4 (MPEG-4 Part 14)</SelectItem>
                      <SelectItem value="webm">WebM (VP9/VP8)</SelectItem>
                      <SelectItem value="mkv">MKV (Matroska Video)</SelectItem>
                      <SelectItem value="avi">AVI (Audio Video Interleave)</SelectItem>
                      <SelectItem value="mov">MOV (QuickTime Movie)</SelectItem>
                      <SelectItem value="flv">FLV (Flash Video)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {audioOnly && (
                <div className="space-y-2">
                  <Label htmlFor="audio-format">Audio Format</Label>
                  <Select value={audioFormat} onValueChange={setAudioFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp3">MP3 (MPEG-1 Audio Layer 3)</SelectItem>
                      <SelectItem value="m4a">M4A (MPEG-4 Audio)</SelectItem>
                      <SelectItem value="wav">WAV (Waveform Audio)</SelectItem>
                      <SelectItem value="flac">FLAC (Free Lossless Audio Codec)</SelectItem>
                      <SelectItem value="opus">OPUS (Opus Interactive Audio)</SelectItem>
                      <SelectItem value="aac">AAC (Advanced Audio Coding)</SelectItem>
                      <SelectItem value="ogg">OGG (Ogg Vorbis)</SelectItem>
                      <SelectItem value="alac">ALAC (Apple Lossless)</SelectItem>
                      <SelectItem value="wma">WMA (Windows Media Audio)</SelectItem>
                      <SelectItem value="ac3">AC3 (Dolby Digital)</SelectItem>
                      <SelectItem value="dts">DTS (Digital Theater Systems)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Additional Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="subtitles" 
                    checked={subtitles}
                    onCheckedChange={(checked) => setSubtitles(checked as boolean)}
                  />
                  <Label htmlFor="subtitles">Download Subtitles</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="playlist" 
                    checked={playlist}
                    onCheckedChange={(checked) => setPlaylist(checked as boolean)}
                  />
                  <Label htmlFor="playlist">Download Entire Playlist</Label>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Download Button */}
              <Button 
                onClick={handleDownload} 
                disabled={isLoading || !url.trim() || !outputPath.trim() || (playlistInfo && selectedVideos.length === 0)}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Download className="h-4 w-4 mr-2 animate-spin" />
                    Starting Download...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {playlistInfo 
                      ? `Download ${selectedVideos.length} Selected ${audioOnly ? `Audio (${audioFormat.toUpperCase()})` : 'Video'}${selectedVideos.length > 1 ? 's' : ''}`
                      : `Download ${audioOnly ? `Audio (${audioFormat.toUpperCase()})` : 'Video'}`
                    }
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Download Queue</span>
                {downloads.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleClearCompleted}
                      disabled={!downloads.some(task => task.status === 'completed')}
                    >
                      Clear Completed
                    </Button>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                Track all your downloads and their progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {downloads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No downloads yet</p>
                  <p className="text-sm">Start by adding a URL to download</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {downloads.map((task) => (
                    <Card key={task.id} className="p-4">
                      <div className="space-y-3">
                        {/* Header Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {getStatusIcon(task.status)}
                            <h4 className="font-medium truncate pr-2" title={task.title}>
                              {task.title}
                            </h4>
                            {getStatusBadge(task.status)}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {task.status === 'error' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRetryDownload(task)}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Retry
                              </Button>
                            )}

                            {(task.status === 'completed' || task.status === 'error') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveTask(task.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="space-y-1">
                            <p><span className="font-medium">Format:</span> {task.format.toUpperCase()}</p>
                            <p><span className="font-medium">Quality:</span> {task.quality}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="truncate" title={task.url}>
                              <span className="font-medium">URL:</span> {task.url}
                            </p>
                            {task.outputPath && (
                              <p className="truncate" title={task.outputPath}>
                                <span className="font-medium">Output:</span> {task.outputPath}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Progress Section */}
                        {task.status === 'downloading' && (
                          <div className="space-y-2">
                            <Progress value={task.progress} className="w-full" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{task.progress}%</span>
                              <div className="flex gap-4">
                                {task.speed && <span>Speed: {task.speed}</span>}
                                {task.eta && <span>ETA: {task.eta}</span>}
                                {task.size && <span>Size: {task.size}</span>}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Error Section */}
                        {task.status === 'error' && task.error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm break-words">
                              {task.error.length > 200 ? `${task.error.substring(0, 200)}...` : task.error}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {/* Download Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Download Statistics
              </CardTitle>
              <CardDescription>
                Overview of your download activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {downloads.filter(task => task.status === 'completed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {downloads.filter(task => task.status === 'downloading').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Downloading</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {downloads.filter(task => task.status === 'error').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                Configure advanced yt-dlp options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-args">Custom yt-dlp Arguments</Label>
                <Textarea
                  id="custom-args"
                  value={customArgs}
                  onChange={(e) => setCustomArgs(e.target.value)}
                  placeholder="--extract-flat --write-description --write-info-json"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Add custom yt-dlp command line arguments. Use with caution.
                </p>
              </div>

              {/* Download Preferences */}
              <div className="space-y-4">
                <h4 className="font-medium">Default Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Audio Format</Label>
                    <Select value={audioFormat} onValueChange={setAudioFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp3">MP3</SelectItem>
                        <SelectItem value="m4a">M4A</SelectItem>
                        <SelectItem value="wav">WAV</SelectItem>
                        <SelectItem value="flac">FLAC</SelectItem>
                        <SelectItem value="opus">OPUS</SelectItem>
                        <SelectItem value="aac">AAC</SelectItem>
                        <SelectItem value="ogg">OGG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Format Information Dialog */}
      <Dialog open={showFormats} onOpenChange={setShowFormats}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Available Formats</DialogTitle>
            <DialogDescription>
              Detailed format information for the video/audio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap">
              {formatInfo}
            </pre>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>Quality Selection Tips:</strong> Higher format codes generally indicate better quality. Look for formats with higher resolution (height) and bitrate (tbr).
              </p>
              <p>
                <strong>Advanced Format Selection:</strong> This downloader uses intelligent format selectors that automatically choose the best H.264 codec for optimal quality and compatibility. For 1080p, it specifically targets AVC (H.264) video with MP4A audio for the best results.
              </p>
              <p>
                <strong>Format Priority:</strong> The system tries multiple format combinations in order: Best quality with specific codecs → Best quality general → Available fallbacks.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
