import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Loader2, Play, Music, Video, Clock, Copy, ExternalLink, CheckCircle, Monitor, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MediaFormat {
  id: string;
  url: string;
  thumbnail?: string;
  quality: string;
  resolution?: string;
  is_audio: boolean;
  type: string;
  extension: string;
  mimeType?: string;
  codec?: string;
  bandwidth?: number;
  frameRate?: number;
}

interface InstagramData {
  url: string;
  source: string;
  shortcode: string;
  author: string;
  music_attribution_info?: any;
  view_count?: number;
  like_count?: number;
  title: string;
  thumbnail: string;
  medias: MediaFormat[];
  type: string;
  error: boolean;
  time_end: number;
}

export default function InstagramDownloader() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<InstagramData | null>(null);
  const [error, setError] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [notification, setNotification] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [selectedVideoFormat, setSelectedVideoFormat] = useState<MediaFormat | null>(null);
  const [selectedAudioFormat, setSelectedAudioFormat] = useState<MediaFormat | null>(null);
  const [activeTab, setActiveTab] = useState<'download' | 'preview'>('download');

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchData = async () => {
    if (!url) {
      setError('Please enter an Instagram URL');
      return;
    }

    setIsLoading(true);
    setError('');
    setData(null);
    setSelectedVideoFormat(null);
    setSelectedAudioFormat(null);

    try {
      const response = await fetch(`https://api.nzr.web.id/api/download/aio?url=${encodeURIComponent(url)}`);
      const result = await response.json();

      if (result.error) {
        setError('Failed to fetch Instagram data');
        showNotification('error', 'Failed to fetch Instagram data');
        return;
      }

      setData(result);
      showNotification('success', 'Instagram data fetched successfully!');
    } catch (err) {
      setError('Network error or invalid URL');
      showNotification('error', 'Network error or invalid URL');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDownload = async (media: MediaFormat) => {
    try {
      showNotification('info', 'Starting download...');

      // Method 1: Direct download attempt
      const link = document.createElement('a');
      link.href = media.url;
      link.download = `instagram_${media.quality}_${Date.now()}.${media.extension}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification('success', `Download started for ${media.quality} quality!`);

      // Method 2: Fallback with fetch and blob
      setTimeout(async () => {
        try {
          const response = await fetch(media.url, {
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const fallbackLink = document.createElement('a');
            fallbackLink.href = blobUrl;
            fallbackLink.download = `instagram_${media.quality}_${Date.now()}.${media.extension}`;
            document.body.appendChild(fallbackLink);
            fallbackLink.click();
            document.body.removeChild(fallbackLink);
            window.URL.revokeObjectURL(blobUrl);
          }
        } catch (fallbackError) {
          console.log('Fallback download failed, using Tauri shell');
          // Method 3: Tauri shell command as last resort
          try {
            const { invoke } = await import('@tauri-apps/api/tauri');
            await invoke('download_file', {
              url: media.url,
              filename: `instagram_${media.quality}_${Date.now()}.${media.extension}`
            });
            showNotification('success', 'Download completed via system downloader!');
          } catch (tauriError) {
            console.error('All download methods failed:', tauriError);
            showNotification('error', 'Download failed. Please try copying the URL and download manually.');
          }
        }
      }, 1000);

    } catch (error) {
      console.error('Download failed:', error);
      showNotification('error', 'Download failed. Please try again.');
    }
  };

  const handleCopyUrl = async (media: MediaFormat) => {
    try {
      await navigator.clipboard.writeText(media.url);
      showNotification('success', 'URL copied to clipboard! You can now paste it in your browser and press Ctrl+J to download.');
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
    setSelectedAudioFormat(null);
    setActiveTab('preview');
  };

  const handlePreviewAudio = (media: MediaFormat) => {
    setSelectedAudioFormat(media);
    setSelectedVideoFormat(null);
    setActiveTab('preview');
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bandwidth: number) => {
    if (!bandwidth) return 'Unknown';
    const sizeInMB = bandwidth / (8 * 1024 * 1024);
    return `${sizeInMB.toFixed(1)} MB/s`;
  };

  const getVideoFormats = () => data?.medias.filter(m => m.type === 'video') || [];
  const getAudioFormats = () => data?.medias.filter(m => m.type === 'audio') || [];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Instagram Downloader
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter Instagram URL (posts, reels, stories)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
          />
          <Button onClick={fetchData} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
          </Button>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}

        {notification && (
          <div className={`p-3 text-sm border rounded flex items-center gap-2 ${
            notification.type === 'success' ? 'text-green-600 bg-green-50 border-green-200' :
            notification.type === 'error' ? 'text-red-600 bg-red-50 border-red-200' :
            'text-blue-600 bg-blue-50 border-blue-200'
          }`}>
            {notification.type === 'success' && <CheckCircle className="h-4 w-4" />}
            {notification.message}
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {/* Content Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-32 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                    {data.thumbnail ? (
                      <img 
                        src={data.thumbnail} 
                        alt="Content thumbnail"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Thumbnail failed to load:', data.thumbnail);
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-muted flex items-center justify-center ${data.thumbnail ? 'hidden' : ''}`}>
                      <div className="text-center text-xs text-muted-foreground">
                        <Video className="h-6 w-6 mx-auto mb-1" />
                        No Thumbnail
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg line-clamp-2">{data.title}</h3>
                    <p className="text-sm text-muted-foreground">@{data.author}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{data.source}</Badge>
                      <Badge variant="outline">{data.medias.length} formats</Badge>
                      {data.shortcode && <Badge variant="outline">ID: {data.shortcode}</Badge>}
                    </div>
                    {(data.view_count || data.like_count) && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {data.view_count && <span>{data.view_count.toLocaleString()} views</span>}
                        {data.like_count && <span>{data.like_count.toLocaleString()} likes</span>}
                      </div>
                    )}
                    {/* Debug info - remove in production */}
                    {data.thumbnail && (
                      <div className="text-xs text-muted-foreground">
                        Thumbnail URL: {data.thumbnail.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for Download and Preview */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'download' | 'preview')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="download" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="download" className="space-y-4">
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
                          <div key={media.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{media.quality}</Badge>
                                <Badge variant="secondary">{media.extension.toUpperCase()}</Badge>
                                {media.resolution && <Badge variant="outline">{media.resolution}</Badge>}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {media.bandwidth && `${formatFileSize(media.bandwidth)} • `}
                                {media.frameRate && `${media.frameRate}fps • `}
                                {media.codec && `${media.codec}`}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handlePreviewVideo(media)}
                                title="Preview video in app"
                              >
                                <Eye className="h-4 w-4" />
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
                          <div key={media.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{media.quality}</Badge>
                                <Badge variant="secondary">{media.extension.toUpperCase()}</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {media.bandwidth && `${formatFileSize(media.bandwidth)} • `}
                                {media.codec && `${media.codec}`}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handlePreviewAudio(media)}
                                title="Preview audio in app"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                {(selectedVideoFormat || selectedAudioFormat) ? (
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
                                poster={selectedVideoFormat.thumbnail || data.thumbnail}
                                preload="metadata"
                              >
                                <source src={selectedVideoFormat.url} type={selectedVideoFormat.mimeType || `video/${selectedVideoFormat.extension}`} />
                                Your browser does not support the video tag.
                              </video>
                            </div>
                            
                            {/* Video Info */}
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{selectedVideoFormat.quality}</Badge>
                                  <Badge variant="secondary">{selectedVideoFormat.extension.toUpperCase()}</Badge>
                                  {selectedVideoFormat.resolution && <Badge variant="outline">{selectedVideoFormat.resolution}</Badge>}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {selectedVideoFormat.bandwidth && `${formatFileSize(selectedVideoFormat.bandwidth)} • `}
                                  {selectedVideoFormat.frameRate && `${selectedVideoFormat.frameRate}fps • `}
                                  {selectedVideoFormat.codec && `${selectedVideoFormat.codec}`}
                                </div>
                              </div>
                            </div>
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
                                <source src={selectedAudioFormat.url} type={selectedAudioFormat.mimeType || `audio/${selectedAudioFormat.extension}`} />
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
                                <p className="text-sm text-muted-foreground">@{data.author}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Music className="h-4 w-4" />
                                  Audio Only
                                </div>
                              </div>
                            </div>
                            
                            {/* Audio Info */}
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{selectedAudioFormat.quality}</Badge>
                                  <Badge variant="secondary">{selectedAudioFormat.extension.toUpperCase()}</Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {selectedAudioFormat.bandwidth && `${formatFileSize(selectedAudioFormat.bandwidth)} • `}
                                  {selectedAudioFormat.codec && `${selectedAudioFormat.codec}`}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Eye className="h-12 w-12" />
                        <h3 className="text-lg font-medium">No Preview Selected</h3>
                        <p className="text-sm">Click the preview button (👁️) on any format in the Download tab to see a preview here.</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
