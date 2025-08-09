import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimeItem {
  title: string;
  poster: string;
  episodes: number;
  score: string;
  lastReleaseDate: string;
  animeId: string;
}

interface CompletedData {
  animeList: AnimeItem[];
  pagination?: {
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
    totalPages: number;
  };
}

interface AnimeCompletedProps {
  onAnimeSelect: (animeId: string) => void;
}

export default function AnimeCompleted({ onAnimeSelect }: AnimeCompletedProps) {
  const [data, setData] = useState<CompletedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchCompletedData(currentPage);
  }, [currentPage]);

  const fetchCompletedData = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(`https://api.bellonime.web.id/otakudesu/completed?page=${page}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch completed anime data');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getScoreColor = (score: string) => {
    const numScore = parseFloat(score);
    if (numScore >= 8) return 'bg-green-500';
    if (numScore >= 7) return 'bg-yellow-500';
    if (numScore >= 6) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const AnimeCard = ({ anime }: { anime: AnimeItem }) => (
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

        {/* Score */}
        <Badge className={cn("absolute top-2 right-2 text-white", getScoreColor(anime.score))}>
          <Star className="h-3 w-3 mr-1" />
          {anime.score}
        </Badge>

        {/* Completed Badge */}
        <Badge className="absolute bottom-2 left-2 bg-blue-500/90 text-white">
          Completed
        </Badge>

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
          <div className="flex items-center">
            <Star className="h-3 w-3 mr-1" />
            Score: {anime.score}
          </div>
          <div>
            {anime.lastReleaseDate}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-4">Error loading completed anime</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => fetchCompletedData(currentPage)} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">Completed Anime</h3>
          <p className="text-sm text-muted-foreground">
            {data.pagination ? (
              <>Page {data.pagination.currentPage} of {data.pagination.totalPages}</>
            ) : (
              'Loading pagination...'
            )}
          </p>
        </div>
        
        {/* Pagination Info */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => data.pagination?.prevPage && handlePageChange(data.pagination.prevPage)}
            disabled={!data.pagination?.hasPrevPage}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground px-3">
            {data.pagination ? (
              <>{data.pagination.currentPage} / {data.pagination.totalPages}</>
            ) : (
              '- / -'
            )}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => data.pagination?.nextPage && handlePageChange(data.pagination.nextPage)}
            disabled={!data.pagination?.hasNextPage}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Anime Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {data.animeList.map((anime) => (
          <AnimeCard key={anime.animeId} anime={anime} />
        ))}
      </div>

      {/* Bottom Pagination */}
      {data.pagination && (
        <div className="flex justify-center items-center space-x-2 pt-6">
          <Button
            variant="outline"
            onClick={() => data.pagination?.prevPage && handlePageChange(data.pagination.prevPage)}
            disabled={!data.pagination?.hasPrevPage}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {/* Page Numbers */}
            {data.pagination && Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
              const page = Math.max(1, data.pagination!.currentPage - 2) + i;
              if (page > data.pagination!.totalPages) return null;
              
              return (
                <Button
                  key={page}
                  variant={page === data.pagination!.currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            onClick={() => data.pagination?.nextPage && handlePageChange(data.pagination.nextPage)}
            disabled={!data.pagination?.hasNextPage}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
