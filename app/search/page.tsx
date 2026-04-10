"use client";

import { useState, useCallback } from "react";
import { usePlayer, Song } from "@/app/context/PlayerContext";
import { SongCard } from "@/app/components/SongCard";
import { SearchBar } from "@/app/components/SearchBar";
import { searchMusic } from "@/lib/youtube";
import { mapYouTubeVideo, YouTubeVideo } from "@/lib/types";

// Convert YouTubeVideo to Song type
function toSong(video: YouTubeVideo): Song {
  return {
    videoId: video.videoId,
    title: video.title,
    channelTitle: video.channelTitle,
    thumbnail: video.thumbnail,
    thumbnailHigh: video.thumbnailHigh,
  };
}

export default function SearchPage() {
  const { playSong, addToPlaylist } = usePlayer();
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const data = await searchMusic(query, 30);
      const videos = data.items.map(mapYouTubeVideo);
      setSearchResults(videos.map(toSong));
    } catch (err: any) {
      console.error("Error searching music:", err);
      setError(err.message || "Failed to search. Please check your API key.");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePlaySong = (song: Song) => {
    playSong(song, searchResults);
  };

  return (
    <main className="px-6 md:px-12 py-8">
      {/* Search Header */}
      <div className="mb-10">
        <h1 className="font-headline text-3xl md:text-4xl font-bold mb-6">Search Music</h1>
        <SearchBar onSearch={handleSearch} isLoading={loading} />
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-red-400 mb-4">
            error_outline
          </span>
          <p className="text-red-400 mb-4">{error}</p>
          <p className="text-on-surface-variant text-sm">
            Make sure your YouTube API key is correctly configured in .env.local
          </p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-video bg-surface-variant rounded-xl mb-3" />
              <div className="h-4 bg-surface-variant rounded w-3/4 mb-2" />
              <div className="h-3 bg-surface-variant rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {hasSearched && !loading && !error && searchResults.length === 0 && (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">
            search_off
          </span>
          <h3 className="font-headline text-2xl font-bold mb-2">No results found</h3>
          <p className="text-on-surface-variant">Try searching for a different song or artist</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && searchResults.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-headline text-xl font-bold">
              Search Results ({searchResults.length})
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
            {searchResults.map((song) => (
              <SongCard
                key={song.videoId}
                song={song}
                onPlay={handlePlaySong}
                onAddToPlaylist={addToPlaylist}
                size="md"
              />
            ))}
          </div>
        </div>
      )}

      {/* Initial state */}
      {!hasSearched && !loading && !error && (
        <div className="text-center py-24">
          <span className="material-symbols-outlined text-8xl text-on-surface-variant/30 mb-6">
            music_note
          </span>
          <h2 className="font-headline text-2xl font-bold mb-2">Find Your Music</h2>
          <p className="text-on-surface-variant">
            Search for any song, artist, or album using the search bar above
          </p>
        </div>
      )}
    </main>
  );
}
