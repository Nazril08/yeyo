import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Loader2, Play, Music, Video, Clock, Copy, ExternalLink, CheckCircle, Monitor, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MediaFormat {
  formatId: number;
  label: string;
  type: string;
  ext: string;
  quality: string;
  width?: number;
  height?: number;
  url: string;
  bitrate?: number;
  fps?: number;
  audioQuality?: string;
  audioSampleRate?: string;
  mimeType: string;
  duration: number;
  is_audio?: boolean;
  extension: string;
}

interface YouTubeData {
  url: string;
  source: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: number;
  medias: MediaFormat[];
  type: string;
  error: boolean;
  time_end: number;
}

export default function YouTubeDownloader() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<YouTubeData | null>(null);
  const [error, setError] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [selectedVideoFormat, setSelectedVideoFormat] = useState<MediaFormat | null>(null);
  const [selectedAudioFormat, setSelectedAudioFormat] = useState<MediaFormat | null>(null);

  const handleFetch = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setData(null);
    setSelectedFormat('');

    try {
      const encodedUrl = encodeURIComponent(url);
      const response = await fetch(`https://api.nzr.web.id/api/download/aio?url=${encodedUrl}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch YouTube data');
      }

      const result: YouTubeData = await response.json();
      
      if (result.error) {
        throw new Error('Error processing YouTube URL');
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDownload = async (media: MediaFormat) => {
    const sanitizedTitle = data?.title.replace(/[<>:"/\\|?*]/g, '') || 'youtube_video';
    const filename = `${sanitizedTitle}.${media.extension}`;

    // Check if we're in Tauri and try native download first
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      try {
        // Use Tauri's shell open command to open URL in default browser
        const { open } = await import('@tauri-apps/api/shell');
        await open(media.url);
        
        showNotification('info', `Opening download URL in your default browser.\n\nOnce opened:\n1. Press Ctrl+J to see downloads\n2. Or right-click video and "Save video as..."\n\nFilename: ${filename}`);
        return;
      } catch (tauriError) {
        console.log('Tauri method failed, trying web method...');
      }
    }

    // For YouTube/Google Video URLs, we need to handle them differently
    // These URLs have CORS restrictions and expire quickly
    
    try {
      // Method 1: Direct navigation (most reliable for YouTube URLs)
      const link = document.createElement('a');
      link.href = media.url;
      link.download = filename;
      link.target = '_blank'; // Open in new tab to trigger download
      link.rel = 'noopener noreferrer';
      
      // Add click event to handle the download
      link.addEventListener('click', (e) => {
        // Let the browser handle the download
        console.log('Triggering download for:', filename);
      });
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show user instruction
      showNotification('info', `Download initiated! If download doesn't start automatically:\n\n1. Check your Downloads folder\n2. Press Ctrl+J in the new tab for downloads\n3. Right-click video and select "Save video as..."\n\nFilename: ${filename}`);
      
    } catch (error) {
      console.error('Download failed:', error);
      
      // Fallback: Copy URL to clipboard
      try {
        await navigator.clipboard.writeText(media.url);
        showNotification('error', `Download method failed. URL copied to clipboard!\n\nTo download:\n1. Paste URL in new browser tab\n2. Press Ctrl+J to open downloads\n3. Right-click video and "Save video as..."\n\nFilename: ${filename}`);
      } catch (clipboardError) {
        showNotification('error', `Download failed. Please copy URL manually and open in browser.\n\nFilename: ${filename}`);
      }
    }
  };

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCopyUrl = async (media: MediaFormat) => {
    try {
      await navigator.clipboard.writeText(media.url);
      const filename = `${data?.title.replace(/[<>:"/\\|?*]/g, '') || 'youtube_video'}.${media.extension}`;
      showNotification('success', `URL copied! Open in browser, press Ctrl+J for downloads, or right-click video to "Save as..." \n\nSuggested filename: ${filename}`);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      showNotification('error', 'Failed to copy URL. Please copy manually from the Open URL button.');
    }
  };

  const handleOpenUrl = (media: MediaFormat) => {
    window.open(media.url, '_blank', 'noopener,noreferrer');
  };

  const handlePreviewVideo = (media: MediaFormat) => {
    setSelectedVideoFormat(media);
    setSelectedAudioFormat(null); // Clear audio selection when video is selected
  };

  const handlePreviewAudio = (media: MediaFormat) => {
    setSelectedAudioFormat(media);
    setSelectedVideoFormat(null); // Clear video selection when audio is selected
  };

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bitrate: number, duration: number) => {
    if (!bitrate || !duration) return 'Unknown';
    const sizeInMB = (bitrate * duration) / (8 * 1024 * 1024);
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const getVideoFormats = () => data?.medias.filter(m => m.type === 'video') || [];
  const getAudioFormats = () => data?.medias.filter(m => m.type === 'audio') || [];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          YouTube Downloader
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Paste YouTube URL here..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleFetch()}
          />
          <Button onClick={handleFetch} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Fetch'
            )}
          </Button>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {notification && (
          <div className={`p-3 rounded-lg text-sm ${
            notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' && <CheckCircle className="h-4 w-4" />}
              <span className="whitespace-pre-wrap">{notification.message}</span>
            </div>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {/* Video Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <img 
                    src={data.thumbnail} 
                    alt="Video thumbnail"
                    className="w-32 h-24 object-cover rounded"
                  />
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{data.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatDuration(data.duration)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{data.source}</Badge>
                      <Badge variant="outline">{data.medias.length} formats</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Section */}
            {(selectedVideoFormat || selectedAudioFormat) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {selectedVideoFormat ? (
                      <>
                        <Monitor className="h-4 w-4" />
                        Video Preview
                        <Badge variant="outline">{selectedVideoFormat.quality}</Badge>
                      </>
                    ) : (
                      <>
                        <Music className="h-4 w-4" />
                        Audio Preview
                        <Badge variant="outline">{selectedAudioFormat?.quality}</Badge>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedVideoFormat ? (
                      <>
                        {/* Video Player */}
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                          <video
                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                            controls
                            poster={data.thumbnail}
                            preload="metadata"
                          >
                            <source src={selectedVideoFormat.url} type={selectedVideoFormat.mimeType} />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                        
                        {/* Video Info */}
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{selectedVideoFormat.quality}</Badge>
                              <Badge variant="secondary">{selectedVideoFormat.ext.toUpperCase()}</Badge>
                              {selectedVideoFormat.fps && <Badge variant="outline">{selectedVideoFormat.fps}fps</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {selectedVideoFormat.width && selectedVideoFormat.height && `${selectedVideoFormat.width}x${selectedVideoFormat.height} • `}
                              {selectedVideoFormat.bitrate && `${Math.round(selectedVideoFormat.bitrate / 1000)}kbps • `}
                              {formatFileSize(selectedVideoFormat.bitrate || 0, data.duration)}
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleFileDownload(selectedVideoFormat)}
                            className="ml-4"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download This Quality
                          </Button>
                        </div>

                        {/* Alternative: YouTube Embed (fallback) */}
                        {data.url && (
                          <div className="space-y-2">
                            <Separator />
                            <p className="text-sm text-muted-foreground">
                              If video doesn't load above, try YouTube embed:
                            </p>
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                              <iframe
                                className="absolute top-0 left-0 w-full h-full rounded-lg"
                                src={`https://www.youtube.com/embed/${getYouTubeVideoId(data.url)}?rel=0`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          </div>
                        )}
                      </>
                    ) : selectedAudioFormat ? (
                      <>
                        {/* Audio Player */}
                        <div className="w-full">
                          <audio
                            className="w-full"
                            controls
                            preload="metadata"
                          >
                            <source src={selectedAudioFormat.url} type={selectedAudioFormat.mimeType} />
                            Your browser does not support the audio tag.
                          </audio>
                        </div>
                        
                        {/* Audio Visualization/Artwork */}
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                          <img 
                            src={data.thumbnail} 
                            alt="Audio artwork"
                            className="w-20 h-20 object-cover rounded"
                          />
                          <div className="flex-1 space-y-2">
                            <h4 className="font-semibold line-clamp-2">{data.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Music className="h-4 w-4" />
                              Audio Only • {formatDuration(data.duration)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Audio Info */}
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{selectedAudioFormat.quality}</Badge>
                              <Badge variant="secondary">{selectedAudioFormat.ext.toUpperCase()}</Badge>
                              {selectedAudioFormat.audioQuality && (
                                <Badge variant="outline">{selectedAudioFormat.audioQuality.replace('AUDIO_QUALITY_', '')}</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {selectedAudioFormat.bitrate && `${Math.round(selectedAudioFormat.bitrate / 1000)}kbps • `}
                              {selectedAudioFormat.audioSampleRate && `${selectedAudioFormat.audioSampleRate}Hz • `}
                              {formatFileSize(selectedAudioFormat.bitrate || 0, data.duration)}
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleFileDownload(selectedAudioFormat)}
                            className="ml-4"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download This Quality
                          </Button>
                        </div>
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video Formats */}
            {getVideoFormats().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Video className="h-4 w-4" />
                    Video Formats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {getVideoFormats().map((media) => (
                      <div key={media.formatId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{media.quality}</Badge>
                            <Badge variant="secondary">{media.ext.toUpperCase()}</Badge>
                            {media.fps && <Badge variant="outline">{media.fps}fps</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {media.width && media.height && `${media.width}x${media.height} • `}
                            {media.bitrate && `${Math.round(media.bitrate / 1000)}kbps • `}
                            {formatFileSize(media.bitrate || 0, data.duration)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleFileDownload(media)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePreviewVideo(media)}
                            title="Preview video in app"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCopyUrl(media)}
                            title="Copy URL (use Ctrl+J in browser to download)"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOpenUrl(media)}
                            title="Open in new tab"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audio Formats */}
            {getAudioFormats().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Music className="h-4 w-4" />
                    Audio Formats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {getAudioFormats().map((media) => (
                      <div key={media.formatId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{media.quality}</Badge>
                            <Badge variant="secondary">{media.ext.toUpperCase()}</Badge>
                            {media.audioQuality && (
                              <Badge variant="outline">{media.audioQuality.replace('AUDIO_QUALITY_', '')}</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {media.bitrate && `${Math.round(media.bitrate / 1000)}kbps • `}
                            {media.audioSampleRate && `${media.audioSampleRate}Hz • `}
                            {formatFileSize(media.bitrate || 0, data.duration)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleFileDownload(media)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePreviewAudio(media)}
                            title="Preview audio in app"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCopyUrl(media)}
                            title="Copy URL (use Ctrl+J in browser to download)"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleOpenUrl(media)}
                            title="Open in new tab"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
