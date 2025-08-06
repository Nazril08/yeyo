import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { FFmpegOverview } from './ffmpeg-overview';
import { FFmpegRouter } from './ffmpeg-router';

interface FFmpegLayoutProps {
  className?: string;
}

export function FFmpegLayout({ className }: FFmpegLayoutProps) {
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const [ffmpegSubPage, setFFmpegSubPage] = useState<'overview' | 'video' | 'audio' | 'utilities'>('overview');

  const handleToolSelect = (toolId: string) => {
    setCurrentTool(toolId);
  };

  const handleBack = () => {
    setCurrentTool(null);
  };

  if (currentTool) {
    return (
      <div className={className}>
        <FFmpegRouter currentTool={currentTool} onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Sub Navigation */}
      <div className="flex items-center space-x-4 lg:space-x-6 border-b pb-4">
        <button
          onClick={() => setFFmpegSubPage("overview")}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            ffmpegSubPage === "overview" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Overview
        </button>
        <button
          onClick={() => setFFmpegSubPage("video")}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            ffmpegSubPage === "video" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Video
        </button>
        <button
          onClick={() => setFFmpegSubPage("audio")}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            ffmpegSubPage === "audio" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Audio
        </button>
        <button
          onClick={() => setFFmpegSubPage("utilities")}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            ffmpegSubPage === "utilities" ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Utilities
        </button>
      </div>
      
      {/* FFmpeg Content */}
      {ffmpegSubPage === "overview" && (
        <FFmpegOverview onToolSelect={handleToolSelect} category="overview" />
      )}
      
      {ffmpegSubPage === "video" && (
        <FFmpegOverview onToolSelect={handleToolSelect} category="video" />
      )}
      
      {ffmpegSubPage === "audio" && (
        <FFmpegOverview onToolSelect={handleToolSelect} category="audio" />
      )}
      
      {ffmpegSubPage === "utilities" && (
        <FFmpegOverview onToolSelect={handleToolSelect} category="utilities" />
      )}
    </div>
  );
}
