import React from 'react';
import { Button } from '@/components/ui/button';
import VideoConverter from './video-converter';
import VideoConverterNew from './video-converter-new';
import MediaLooper from './media-looper';
import VideoResizer from './video-resizer';
import NoiseReducer from './noise-reducer';
// Import komponen lain nanti saat dibutuhkan

interface FFmpegRouterProps {
  currentTool: string;
  onBack: () => void;
}

export function FFmpegRouter({ currentTool, onBack }: FFmpegRouterProps) {
  const toolComponents: Record<string, { component: React.ReactNode; title: string }> = {
    'video-converter': {
      component: <VideoConverterNew />,
      title: 'Video Converter'
    },
    'video-resizer': {
      component: <VideoResizer />,
      title: 'Video Resizer'
    },
    'noise-reducer': {
      component: <NoiseReducer />,
      title: 'Noise Reducer'
    },
    'ffmpeg-video-converter': {
      component: <VideoConverter />,
      title: 'FFmpeg Video Converter'
    },
    'media-looper': {
      component: <MediaLooper />,
      title: 'Media Looper'
    },
    // Komponen lain akan ditambahkan nanti
    'ffmpeg-video-compressor': {
      component: <div className="p-8 text-center"><p>Video Compressor - Coming Soon</p></div>,
      title: 'FFmpeg Video Compressor'
    },
    'ffmpeg-video-trimmer': {
      component: <div className="p-8 text-center"><p>Video Trimmer - Coming Soon</p></div>,
      title: 'FFmpeg Video Trimmer'
    },
    'ffmpeg-audio-converter': {
      component: <div className="p-8 text-center"><p>Audio Converter - Coming Soon</p></div>,
      title: 'FFmpeg Audio Converter'
    },
    'ffmpeg-audio-extractor': {
      component: <div className="p-8 text-center"><p>Audio Extractor - Coming Soon</p></div>,
      title: 'FFmpeg Audio Extractor'
    },
    'ffmpeg-media-info': {
      component: <div className="p-8 text-center"><p>Media Info - Coming Soon</p></div>,
      title: 'FFmpeg Media Info'
    },
    'ffmpeg-thumbnail-generator': {
      component: <div className="p-8 text-center"><p>Thumbnail Generator - Coming Soon</p></div>,
      title: 'FFmpeg Thumbnail Generator'
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
          <p className="text-muted-foreground">The requested FFmpeg tool could not be found.</p>
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
