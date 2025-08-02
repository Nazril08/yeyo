import React from 'react';
import { Button } from '@/components/ui/button';
import { YtMp4Downloader } from '@/dashboard/components/yt-mp4-downloader';
import { SpotifyDownloader } from '@/dashboard/components/spotify-downloader';
import { ThreadsDownloader } from '@/dashboard/components/threads-downloader';
import { TikTokDownloader } from '@/dashboard/components/tiktok-downloader';
import YouTubeDownloader from '@/dashboard/components/youtube-downloader';
import FacebookDownloader from '@/dashboard/components/facebook-downloader';
import InstagramDownloader from '@/dashboard/components/instagram-downloader';
import AnimagineXL from '@/dashboard/components/animagine-xl';

interface ToolsRouterProps {
  currentTool: string;
  onBack: () => void;
}

export function ToolsRouter({ currentTool, onBack }: ToolsRouterProps) {
  const toolComponents: Record<string, { component: React.ReactNode; title: string }> = {
    'yt-mp4': {
      component: <YtMp4Downloader />,
      title: 'YT MP4 Downloader'
    },
    'spotify': {
      component: <SpotifyDownloader />,
      title: 'Spotify Downloader'
    },
    'threads': {
      component: <ThreadsDownloader />,
      title: 'Threads Downloader'
    },
    'tiktok': {
      component: <TikTokDownloader />,
      title: 'TikTok Downloader'
    },
    'youtube': {
      component: <YouTubeDownloader />,
      title: 'YouTube Downloader'
    },
    'facebook': {
      component: <FacebookDownloader />,
      title: 'Facebook Downloader'
    },
    'instagram': {
      component: <InstagramDownloader />,
      title: 'Instagram Downloader'
    },
    'animagine-xl': {
      component: <AnimagineXL />,
      title: 'Animagine XL - AI Image Generator'
    }
  };

  const currentToolData = toolComponents[currentTool];

  if (!currentToolData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onBack}
          >
            ← Back
          </Button>
        </div>
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold">Tool not found</h3>
          <p className="text-muted-foreground">The requested tool could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onBack}
        >
          ← Back
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentToolData.title}
        </span>
      </div>
      {currentToolData.component}
    </div>
  );
}
