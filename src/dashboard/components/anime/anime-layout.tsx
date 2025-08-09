import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Tv, 
  Calendar, 
  Star, 
  Play,
  Clock,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimeHome from './anime-home';
import AnimeOngoing from './anime-ongoing';
import AnimeCompleted from './anime-completed';
import AnimeSearch from './anime-search';
import AnimeDetail from './anime-detail';
import AnimePlayer from './anime-player';

interface AnimeLayoutProps {
  onBack: () => void;
}

export default function AnimeLayout({ onBack }: AnimeLayoutProps) {
  const [currentView, setCurrentView] = useState<'home' | 'ongoing' | 'completed' | 'search' | 'detail' | 'player'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnime, setSelectedAnime] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null);

  const handleAnimeSelect = (animeId: string) => {
    setSelectedAnime(animeId);
    setCurrentView('detail');
  };

  const handleEpisodeSelect = (episodeId: string) => {
    setSelectedEpisode(episodeId);
    setCurrentView('player');
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setCurrentView('search');
    }
  };

  const handleBack = () => {
    if (currentView === 'player') {
      setCurrentView('detail');
    } else if (currentView === 'detail') {
      setCurrentView('home');
    } else {
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Anime Streaming</h2>
          <p className="text-muted-foreground">Watch your favorite anime with HD quality</p>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search anime..."
              className="w-64 pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} size="sm">
            Search
          </Button>
        </div>
      </div>

      {/* Content */}
      {currentView === 'home' && (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <Tabs value="home" onValueChange={(value) => setCurrentView(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="home" className="flex items-center space-x-2">
                <Tv className="h-4 w-4" />
                <span>Home</span>
              </TabsTrigger>
              <TabsTrigger value="ongoing" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Ongoing</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center space-x-2">
                <Star className="h-4 w-4" />
                <span>Completed</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <AnimeHome onAnimeSelect={handleAnimeSelect} />
        </div>
      )}

      {currentView === 'ongoing' && (
        <AnimeOngoing onAnimeSelect={handleAnimeSelect} />
      )}

      {currentView === 'completed' && (
        <AnimeCompleted onAnimeSelect={handleAnimeSelect} />
      )}

      {currentView === 'search' && (
        <AnimeSearch query={searchQuery} onAnimeSelect={handleAnimeSelect} />
      )}

      {currentView === 'detail' && selectedAnime && (
        <AnimeDetail 
          animeId={selectedAnime} 
          onEpisodeSelect={handleEpisodeSelect}
          onBack={() => setCurrentView('home')}
        />
      )}

      {currentView === 'player' && selectedEpisode && (
        <AnimePlayer 
          episodeId={selectedEpisode}
          onBack={() => setCurrentView('detail')}
        />
      )}
    </div>
  );
}
