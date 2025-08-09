import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Star, 
  Calendar, 
  Clock, 
  Tv, 
  ArrowLeft,
  Download,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Episode {
  title: number;
  episodeId: string;
  href: string;
  otakudesuUrl: string;
}

interface Genre {
  title: string;
  genreId: string;
  href: string;
  otakudesuUrl: string;
}

interface AnimeDetailData {
  title: string;
  poster: string;
  japanese: string;
  score: string;
  producers: string;
  status: string;
  episodes: number | null;
  duration: string;
  aired: string;
  studios: string;
  batch: any;
  synopsis: {
    paragraphs: string[];
    connections: any[];
  };
  genreList: Genre[];
  episodeList: Episode[];
  recommendedAnimeList: any[];
}

interface AnimeDetailProps {
  animeId: string;
  onEpisodeSelect: (episodeId: string) => void;
  onBack: () => void;
}

export default function AnimeDetail({ animeId, onEpisodeSelect, onBack }: AnimeDetailProps) {
  const [data, setData] = useState<AnimeDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnimeDetail();
  }, [animeId]);

  const fetchAnimeDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://api.bellonime.web.id/otakudesu/anime/${animeId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch anime details');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 8) return 'text-green-500';
    if (numScore >= 7) return 'text-yellow-500';
    if (numScore >= 6) return 'text-orange-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Poster */}
          <div className="space-y-4">
            <Skeleton className="aspect-[3/4] w-full rounded-lg" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          {/* Details */}
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">Error loading anime details</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={fetchAnimeDetail} variant="outline">
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
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{data.title}</h2>
          <p className="text-muted-foreground">{data.japanese}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Poster and Actions */}
        <div className="space-y-4">
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
            <img
              src={data.poster}
              alt={data.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Score */}
            <Badge className="absolute top-4 right-4 bg-black/70 text-white">
              <Star className="h-3 w-3 mr-1" />
              {data.score}
            </Badge>

            {/* Status */}
            <Badge 
              className={cn(
                "absolute top-4 left-4",
                data.status === 'Ongoing' ? 'bg-green-500' : 'bg-blue-500'
              )}
            >
              {data.status}
            </Badge>
          </div>

          {/* Quick Actions */}
          {data.episodeList.length > 0 && (
            <Button 
              className="w-full" 
              onClick={() => onEpisodeSelect(data.episodeList[0].episodeId)}
            >
              <Play className="h-4 w-4 mr-2" />
              Watch Episode {data.episodeList[0].title}
            </Button>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <Star className="h-4 w-4 mr-2" />
                Score
              </h4>
              <p className={cn("text-lg font-bold", getScoreColor(data.score))}>
                {data.score}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <Tv className="h-4 w-4 mr-2" />
                Episodes
              </h4>
              <p className="text-lg font-bold">
                {data.episodes || data.episodeList.length}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Duration
              </h4>
              <p>{data.duration}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Aired
              </h4>
              <p>{data.aired}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Studios</h4>
              <p>{data.studios}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Status</h4>
              <Badge variant={data.status === 'Ongoing' ? 'default' : 'secondary'}>
                {data.status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Genres */}
          <div>
            <h4 className="font-semibold mb-3">Genres</h4>
            <div className="flex flex-wrap gap-2">
              {data.genreList.map((genre) => (
                <Badge key={genre.genreId} variant="outline">
                  {genre.title}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Synopsis */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Synopsis
            </h4>
            <div className="space-y-2 text-sm">
              {data.synopsis.paragraphs.map((paragraph, index) => (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Episodes List */}
      {data.episodeList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Play className="h-5 w-5 mr-2" />
              Episodes ({data.episodeList.length})
            </CardTitle>
            <CardDescription>
              Click on any episode to start watching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {data.episodeList.slice().reverse().map((episode) => (
                <Button
                  key={episode.episodeId}
                  variant="outline"
                  className="h-12 justify-center"
                  onClick={() => onEpisodeSelect(episode.episodeId)}
                >
                  <Play className="h-3 w-3 mr-1" />
                  {episode.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
