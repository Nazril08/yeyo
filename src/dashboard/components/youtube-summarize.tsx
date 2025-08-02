import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface YoutubeSummarizeResponse {
  success: boolean;
  data?: {
    content: string;
    url: string;
    video_thumbnail_url: string;
    video_duration: number;
    video_id: string;
  };
  message?: string;
}

export default function YoutubeSummarize() {
  const [url, setUrl] = useState('');
  const [lang, setLang] = useState('id');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<YoutubeSummarizeResponse['data'] | null>(null);
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    if (!youtubeRegex.test(url.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSummary(null);

    try {
      const params = new URLSearchParams({
        url: url.trim(),
        lang: lang,
      });

      const response = await fetch(`https://api.nzr.web.id/api/ai-experience/yt-summarize?${params}`, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'User-Agent': 'Yeyo-Desktop-App'
        }
      });

      if (response.ok) {
        const data: YoutubeSummarizeResponse = await response.json();
        
        if (data.success && data.data) {
          setSummary(data.data);
          toast({
            title: "Success",
            description: "Video summarized successfully!",
          });
        } else {
          throw new Error(data.message || 'Failed to summarize video');
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error summarizing video:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to summarize video",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadSubtitle = async () => {
    if (!summary?.url) return;

    try {
      const response = await fetch(summary.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `youtube-subtitle-${summary.video_id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Subtitle downloaded successfully!",
      });
    } catch (error) {
      console.error('Error downloading subtitle:', error);
      toast({
        title: "Error",
        description: "Failed to download subtitle",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600 rounded-lg flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="white"
                className="w-4 h-4"
              >
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            YouTube Summarize - AI Video Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* YouTube URL */}
          <div className="space-y-2">
            <Label htmlFor="youtube-url">YouTube URL *</Label>
            <Input
              id="youtube-url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          {/* Language Selection */}
          <div className="space-y-2">
            <Label htmlFor="language">Summary Language</Label>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">Indonesian (Default)</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="ko">Korean</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="ru">Russian</SelectItem>
                <SelectItem value="ar">Arabic</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summarize Button */}
          <Button
            onClick={handleSummarize}
            disabled={isLoading || !url.trim()}
            className="w-full"
          >
            {isLoading ? 'Summarizing...' : 'Summarize Video'}
          </Button>

          {/* Summary Result */}
          {summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Video Summary</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadSubtitle}
                    >
                      Download Subtitle
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Video Info */}
                <div className="flex gap-4">
                  {summary.video_thumbnail_url && (
                    <img
                      src={summary.video_thumbnail_url}
                      alt="Video thumbnail"
                      className="w-32 h-24 object-cover rounded-lg border"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="text-sm text-muted-foreground">
                      <strong>Video ID:</strong> {summary.video_id}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <strong>Duration:</strong> {formatDuration(summary.video_duration)}
                    </div>
                  </div>
                </div>

                {/* Summary Content */}
                <div className="space-y-2">
                  <Label>Summary Content:</Label>
                  <div className="max-h-96 overflow-y-auto p-4 bg-muted rounded-lg">
                    <div 
                      className="prose prose-sm max-w-none whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ 
                        __html: summary.content.replace(/\n/g, '<br />') 
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
