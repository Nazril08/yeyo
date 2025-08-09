import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Calendar, Star, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimeItem {
  title: string;
  poster: string;
  episodes: number;
  releaseDay?: string;
  latestReleaseDate?: string;
  lastReleaseDate?: string;
  score?: string;
  animeId: string;
}

interface AnimeHomeData {
  ongoing: {
    animeList: AnimeItem[];
  };
  completed: {
    animeList: AnimeItem[];
  };
}

interface AnimeHomeProps {
  onAnimeSelect: (animeId: string) => void;
}

export default function AnimeHome({ onAnimeSelect }: AnimeHomeProps) {
  const [data, setData] = useState<AnimeHomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://api.bellonime.web.id/otakudesu/home');
      
      if (!response.ok) {
        throw new Error('Failed to fetch anime data');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const AnimeCard = ({ anime, showScore = false }: { anime: AnimeItem; showScore?: boolean }) => (
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
      onClick={() => onAnimeSelect(anime.animeId)}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-lg">
        <img
          src={anime.poster}
          alt={anime.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Episode Count */}
        <Badge className="absolute top-2 left-2 bg-black/70 text-white">
          {anime.episodes} eps
        </Badge>

        {/* Score for completed anime */}
        {showScore && anime.score && (
          <Badge className="absolute top-2 right-2 bg-yellow-500/90 text-black">
            <Star className="h-3 w-3 mr-1" />
            {anime.score}
          </Badge>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Play className="h-8 w-8 text-white fill-white" />
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {anime.title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {anime.releaseDay && (
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {anime.releaseDay}
            </div>
          )}
          
          {(anime.latestReleaseDate || anime.lastReleaseDate) && (
            <div className="text-xs">
              {anime.latestReleaseDate || anime.lastReleaseDate}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Ongoing Section Skeleton */}
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>

        {/* Completed Section Skeleton */}
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">Error loading anime data</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchHomeData} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Currently Airing Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold flex items-center">
              <Eye className="h-5 w-5 mr-2 text-green-500" />
              Currently Airing
            </h3>
            <p className="text-sm text-muted-foreground">Latest episodes available</p>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {data.ongoing.animeList.slice(0, 12).map((anime) => (
            <AnimeCard key={anime.animeId} anime={anime} />
          ))}
        </div>
      </div>

      {/* Recently Completed Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              Recently Completed
            </h3>
            <p className="text-sm text-muted-foreground">Finished anime series</p>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {data.completed.animeList.slice(0, 12).map((anime) => (
            <AnimeCard key={anime.animeId} anime={anime} showScore={true} />
          ))}
        </div>
      </div>
    </div>
  );
}
