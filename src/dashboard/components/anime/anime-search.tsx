import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Play, Search, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimeItem {
  title: string;
  poster: string;
  animeId: string;
}

interface SearchData {
  animeList: AnimeItem[];
}

interface AnimeSearchProps {
  query: string;
  onAnimeSelect: (animeId: string) => void;
}

export default function AnimeSearch({ query, onAnimeSelect }: AnimeSearchProps) {
  const [data, setData] = useState<SearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(query);

  useEffect(() => {
    if (query) {
      searchAnime(query);
    }
  }, [query]);

  const searchAnime = async (q: string) => {
    if (!q.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`https://api.bellonime.web.id/otakudesu/search?q=${encodeURIComponent(q)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search anime');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchAnime(searchQuery);
    }
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
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold">Search Anime</h3>
          <p className="text-sm text-muted-foreground">
            {query && `Results for "${query}"`}
          </p>
        </div>

        {/* Search Input */}
        <div className="flex items-center space-x-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search anime..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] w-full rounded-lg" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <div className="text-red-500 mb-2">Search Error</div>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => searchAnime(query)} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* No Query State */}
      {!query && !loading && !error && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-semibold mb-2">Search for Anime</h4>
            <p className="text-muted-foreground">
              Enter an anime title to start searching
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Results State */}
      {!loading && !error && data && data.animeList.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-semibold mb-2">No Results Found</h4>
            <p className="text-muted-foreground mb-4">
              No anime found for "{query}". Try different keywords.
            </p>
            <Button onClick={() => setSearchQuery('')} variant="outline">
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && !error && data && data.animeList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Found {data.animeList.length} results
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.animeList.map((anime) => (
              <AnimeCard key={anime.animeId} anime={anime} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
