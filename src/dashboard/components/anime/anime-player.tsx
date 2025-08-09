import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, 
  Play, 
  Download, 
  Server, 
  Settings,
  ExternalLink,
  MonitorPlay,
  Smartphone
} from 'lucide-react';

interface ServerItem {
  title: string;
  serverId: string;
  href: string;
}

interface QualityServer {
  title: string;
  serverList: ServerItem[];
}

interface DownloadUrl {
  title: string;
  url: string;
}

interface DownloadQuality {
  title: string;
  size?: string;
  urls: DownloadUrl[];
}

interface EpisodeData {
  title: string;
  animeId: string;
  releaseTime: string;
  defaultStreamingUrl: string;
  hasPrevEpisode: boolean;
  prevEpisode: any;
  hasNextEpisode: boolean;
  nextEpisode: any;
  server: {
    qualities: QualityServer[];
  };
  downloadUrl: {
    qualities: DownloadQuality[];
  };
}

interface AnimePlayerProps {
  episodeId: string;
  onBack: () => void;
}

export default function AnimePlayer({ episodeId, onBack }: AnimePlayerProps) {
  const [data, setData] = useState<EpisodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string>('');
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [iframeKey, setIframeKey] = useState<string>(Date.now().toString()); // Use string for better uniqueness
  const [isLoadingServer, setIsLoadingServer] = useState<boolean>(false);
  const [showIframe, setShowIframe] = useState<boolean>(true); // Control iframe visibility
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEpisodeData();
  }, [episodeId]);

  const fetchEpisodeData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://api.bellonime.web.id/otakudesu/episode/${episodeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch episode data');
      }

      const result = await response.json();
      console.log('📺 Episode data loaded:', result.data);
      console.log('🎬 Available qualities:', result.data.server?.qualities?.map((q: any) => q.title));
      setData(result.data);
      
      // Set initial stream URL and reset iframe key
      if (result.data.defaultStreamingUrl) {
        console.log('🎬 Setting default stream URL:', result.data.defaultStreamingUrl);
        setCurrentStreamUrl(result.data.defaultStreamingUrl);
        setIframeKey(Date.now().toString()); // Reset iframe key for initial load
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleServerSelect = async (serverId: string, serverTitle: string) => {
    try {
      setIsLoadingServer(true);
      setSelectedServer(serverTitle);
      console.log('🔄 Switching to server:', serverTitle, 'ID:', serverId);
      
      // Hide iframe first to force unmount
      setShowIframe(false);
      
      const response = await fetch(`https://api.bellonime.web.id/otakudesu/server/${serverId}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Server response received:', result);
        
        if (result.data?.streamingUrl) {
          const newUrl = result.data.streamingUrl;
          console.log('🎬 New streaming URL:', newUrl);
          console.log('🔄 Old URL was:', currentStreamUrl);
          
          // Update URL and key, then show iframe again
          setCurrentStreamUrl(newUrl);
          setIframeKey(Date.now().toString() + '-' + Math.random().toString(36));
          
          // Wait a moment before showing iframe again
          setTimeout(() => {
            setShowIframe(true);
          }, 100);
          
          console.log('🔑 New iframe key generated');
          
          toast({
            title: "Server Changed",
            description: `Switched to ${serverTitle}`,
          });
        } else {
          console.error('❌ No streaming URL in response:', result);
          setShowIframe(true); // Show iframe back if error
          toast({
            title: "Server Error",
            description: "Failed to get streaming URL from server",
            variant: "destructive",
          });
        }
      } else {
        console.error('❌ Server request failed with status:', response.status);
        setShowIframe(true); // Show iframe back if error
        toast({
          title: "Server Error", 
          description: "Failed to fetch server data",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('❌ Network error:', err);
      setShowIframe(true); // Show iframe back if error
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsLoadingServer(false);
    }
  };

  const handleDownload = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        
        <Skeleton className="aspect-video w-full rounded-lg" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">Error loading episode</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={fetchEpisodeData} variant="outline">
              Try Again
            </Button>
            <Button onClick={onBack} variant="ghost">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{data.title}</h2>
          <p className="text-sm text-muted-foreground">{data.releaseTime}</p>
        </div>

        <div className="flex items-center space-x-2">
          {selectedServer && (
            <Badge variant="outline">
              <Server className="h-3 w-3 mr-1" />
              {selectedServer}
            </Badge>
          )}
        </div>
      </div>

      {/* Video Player */}
      <Card>
        <CardContent className="p-0">
          <div 
            ref={videoContainerRef}
            className="relative aspect-video bg-black rounded-lg overflow-hidden max-w-3xl mx-auto"
          >
            {currentStreamUrl && showIframe ? (
              <iframe
                key={iframeKey} // Use string key for uniqueness
                src={currentStreamUrl}
                className="w-full h-full"
                allowFullScreen
                allow="autoplay; encrypted-media"
                title={data?.title}
                onLoad={() => console.log('🎬 Iframe loaded with URL:', currentStreamUrl)}
              />
            ) : currentStreamUrl && !showIframe ? (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <MonitorPlay className="h-16 w-16 mx-auto mb-4 opacity-50 animate-pulse" />
                  <p>Loading new server...</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <MonitorPlay className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a server to start streaming</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Episode Navigation */}
      {(data.hasPrevEpisode || data.hasNextEpisode) && (
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            disabled={!data.hasPrevEpisode}
            className="flex-1 mr-2"
          >
            {data.hasPrevEpisode ? 'Previous Episode' : 'No Previous Episode'}
          </Button>
          
          <Button 
            variant="outline" 
            disabled={!data.hasNextEpisode}
            className="flex-1 ml-2"
          >
            {data.hasNextEpisode ? 'Next Episode' : 'No Next Episode'}
          </Button>
        </div>
      )}

      {/* Server Selection and Downloads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Streaming Servers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2" />
              Streaming Servers
            </CardTitle>
            <CardDescription>
              Choose a server for streaming
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={data.server.qualities[0]?.title || '480p'} className="w-full">
              <TabsList className={`grid w-full ${data.server.qualities.length <= 3 ? 'grid-cols-3' : data.server.qualities.length === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
                {data.server.qualities.map((quality) => (
                  <TabsTrigger key={quality.title} value={quality.title}>
                    {quality.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {data.server.qualities.map((quality) => (
                <TabsContent key={quality.title} value={quality.title} className="space-y-2 mt-4">
                  {quality.serverList.map((server) => {
                    const isSelected = selectedServer === `${server.title} (${quality.title})`;
                    const isCurrentlyLoading = isLoadingServer && isSelected;
                    
                    return (
                      <Button
                        key={server.serverId}
                        variant={isSelected ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => handleServerSelect(server.serverId, `${server.title} (${quality.title})`)}
                        disabled={isLoadingServer}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {server.title}
                        <Badge variant={isSelected ? "secondary" : "secondary"} className="ml-auto">
                          {quality.title}
                        </Badge>
                        {isCurrentlyLoading ? (
                          <span className="ml-2 text-xs">• Loading...</span>
                        ) : isSelected ? (
                          <span className="ml-2 text-xs">• Playing</span>
                        ) : null}
                      </Button>
                    );
                  })}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Download Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Download Options
            </CardTitle>
            <CardDescription>
              Download episode in various qualities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.downloadUrl.qualities.map((quality) => (
                <div key={quality.title} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{quality.title}</h4>
                    {quality.size && (
                      <Badge variant="secondary">{quality.size}</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {quality.urls.slice(0, 4).map((urlObj) => (
                      <Button
                        key={urlObj.title}
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(urlObj.url)}
                        className="justify-start"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        {urlObj.title}
                      </Button>
                    ))}
                  </div>
                  
                  {quality.urls.length > 4 && (
                    <details className="mt-2">
                      <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                        Show {quality.urls.length - 4} more servers...
                      </summary>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {quality.urls.slice(4).map((urlObj) => (
                          <Button
                            key={urlObj.title}
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(urlObj.url)}
                            className="justify-start"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            {urlObj.title}
                          </Button>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Smartphone className="h-4 w-4 mr-1" />
                Mobile Friendly
              </div>
              <div className="flex items-center">
                <MonitorPlay className="h-4 w-4 mr-1" />
                HD Quality
              </div>
              <div className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-1" />
                External Servers
              </div>
              <div className="flex items-center">
                <MonitorPlay className="h-4 w-4 mr-1" />
                Built-in Fullscreen
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Use iframe's built-in fullscreen controls
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
