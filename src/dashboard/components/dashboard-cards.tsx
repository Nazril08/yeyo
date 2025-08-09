import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, 
  Play, 
  Video,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardCardsProps {
  onNavigate: (page: string) => void;
}

export function DashboardCards({ onNavigate }: DashboardCardsProps) {
  const cards = [
    {
      id: 'tools',
      title: 'Tools & Utilities',
      description: 'Access various tools for downloads, AI, and more',
      icon: Wrench,
      gradient: 'from-blue-500 to-cyan-500',
      stats: '15+ Tools',
      features: ['YouTube Downloader', 'Background Removal', 'AI Tools', 'Social Media Downloads'],
      action: () => onNavigate('tools')
    },
    {
      id: 'media-player',
      title: 'Media Player',
      description: 'Play and manage your audio and video files',
      icon: Play,
      gradient: 'from-purple-500 to-pink-500',
      stats: 'Multi-format',
      features: ['Video Player', 'Audio Player', 'Playlist Management', 'Media Library'],
      action: () => onNavigate('media-player')
    },
    {
      id: 'ffmpeg',
      title: 'Video Processing',
      description: 'Convert, edit, and process your media files',
      icon: Video,
      gradient: 'from-orange-500 to-red-500',
      stats: 'FFmpeg Powered',
      features: ['Video Conversion', 'Audio Extraction', 'Compression', 'Format Support'],
      action: () => onNavigate('ffmpeg')
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <Card 
            key={card.id} 
            className="group relative overflow-hidden border-0 bg-gradient-to-br from-background to-muted/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          >
            {/* Gradient overlay */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity",
              card.gradient
            )} />
            
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div className={cn(
                  "p-2 rounded-lg bg-gradient-to-br",
                  card.gradient
                )}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {card.stats}
                </Badge>
              </div>
              <CardTitle className="text-xl">{card.title}</CardTitle>
              <CardDescription className="text-sm">
                {card.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {card.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-xs text-muted-foreground">
                      <div className="w-1 h-1 bg-current rounded-full mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={card.action}
                  className="w-full group/btn"
                  variant="outline"
                >
                  Open {card.title}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
