import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FFmpegTool {
  id: string;
  name: string;
  title: string;
  description: string;
  category: 'video' | 'audio' | 'utilities';
  icon: React.ReactNode;
}

interface FFmpegOverviewProps {
  onToolSelect: (toolId: string) => void;
  category?: 'overview' | 'video' | 'audio' | 'utilities';
}

export function FFmpegOverview({ onToolSelect, category = 'overview' }: FFmpegOverviewProps) {
  const ffmpegTools: FFmpegTool[] = [
    {
      id: 'video-converter',
      name: 'Video Converter',
      title: 'Convert Video Formats',
      description: 'Convert videos between different formats and codecs with batch processing',
      category: 'video',
      icon: (
        <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="w-3 h-3"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
            <circle cx="12" cy="13" r="3"/>
            <path d="M17 8.5h.01"/>
          </svg>
        </div>
      )
    },
    {
      id: 'video-resizer',
      name: 'Video Resizer',
      title: 'Resize & Scale Video',
      description: 'Resize videos to different resolutions with quality presets',
      category: 'video',
      icon: (
        <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="w-3 h-3"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <path d="M9 9h6v6h-6z" fill="none" stroke="white" strokeWidth="1"/>
            <path d="M15 9l3-3m0 3l-3-3"/>
            <path d="M9 15l-3 3m0-3l3 3"/>
          </svg>
        </div>
      )
    },
    {
      id: 'media-looper',
      name: 'Media Looper',
      title: 'Loop Video/Audio',
      description: 'Create long-duration media by looping short files multiple times',
      category: 'utilities',
      icon: (
        <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="w-3 h-3"
          >
            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.38 0 4.54.94 6.13 2.46L15 8.5"/>
            <path d="M21 3v5h-5"/>
          </svg>
        </div>
      )
    }
  ];

  // Filter tools based on category
  const filteredTools = category === 'overview' 
    ? ffmpegTools 
    : ffmpegTools.filter(tool => tool.category === category);

  return (
    <div className="space-y-6">
      {category === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="white"
                className="w-4 h-4"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">FFmpeg Tools</h2>
          </div>
          <p className="text-muted-foreground">
            Powerful multimedia processing tools powered by FFmpeg. Convert, compress, and manipulate video and audio files with ease.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map((tool) => (
          <Card 
            key={tool.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onToolSelect(tool.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {tool.name}
              </CardTitle>
              {tool.icon}
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{tool.title}</div>
              <p className="text-xs text-muted-foreground">
                {tool.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
