import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Tool {
  id: string;
  name: string;
  title: string;
  description: string;
  category: 'download' | 'ai';
  icon: React.ReactNode;
}

interface ToolsOverviewProps {
  onToolSelect: (toolId: string) => void;
  category?: 'overview' | 'download' | 'ai';
}

export function ToolsOverview({ onToolSelect, category = 'overview' }: ToolsOverviewProps) {
  const tools: Tool[] = [
    {
      id: 'yt-mp4',
      name: 'YT MP4 Downloader',
      title: 'YouTube to MP4',
      description: 'Download videos from YouTube',
      category: 'download',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          className="h-4 w-4 text-muted-foreground"
        >
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        </svg>
      )
    },
    {
      id: 'spotify',
      name: 'Spotify Downloader',
      title: 'Spotify to MP3',
      description: 'Download music from Spotify',
      category: 'download',
      icon: (
        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">S</span>
        </div>
      )
    },
    {
      id: 'threads',
      name: 'Threads Downloader',
      title: 'Threads Media',
      description: 'Download videos and images from Threads',
      category: 'download',
      icon: (
        <div className="w-4 h-4 bg-black rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">@</span>
        </div>
      )
    },
    {
      id: 'tiktok',
      name: 'TikTok Downloader',
      title: 'TikTok Videos',
      description: 'Download videos and audio from TikTok',
      category: 'download',
      icon: (
        <div className="w-4 h-4 bg-black rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">T</span>
        </div>
      )
    },
    {
      id: 'youtube',
      name: 'YouTube Downloader',
      title: 'YouTube Videos',
      description: 'Download videos and audio from YouTube',
      category: 'download',
      icon: (
        <div className="w-4 h-4 bg-red-600 rounded-lg flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="w-3 h-3"
          >
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
      )
    },
    {
      id: 'facebook',
      name: 'Facebook Downloader',
      title: 'Facebook Videos',
      description: 'Download videos and audio from Facebook',
      category: 'download',
      icon: (
        <div className="w-4 h-4 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="w-3 h-3"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
      )
    },
    {
      id: 'instagram',
      name: 'Instagram Downloader',
      title: 'Instagram Content',
      description: 'Download posts, reels, and stories from Instagram',
      category: 'download',
      icon: (
        <div className="w-4 h-4 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-lg flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="w-3 h-3"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </div>
      )
    },
    {
      id: 'animagine-xl',
      name: 'Animagine XL',
      title: 'AI Image Generator',
      description: 'Create stunning images using AI technology',
      category: 'ai',
      icon: (
        <div className="w-4 h-4 bg-purple-600 rounded-lg flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="w-3 h-3"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
        </div>
      )
    },
    {
      id: 'youtube-summarize',
      name: 'YouTube Summarize',
      title: 'AI Video Summary',
      description: 'Generate AI-powered summaries of YouTube videos',
      category: 'ai',
      icon: (
        <div className="w-4 h-4 bg-red-600 rounded-lg flex items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="white"
            className="w-3 h-3"
          >
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
      )
    }
  ];

  // Filter tools based on category
  const filteredTools = category === 'overview' 
    ? tools 
    : tools.filter(tool => tool.category === category);

  return (
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
  );
}
