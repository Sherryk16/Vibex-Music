"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePlayer, Song } from "@/app/context/PlayerContext";
import { SongCard } from "@/app/components/SongCard";
import { getTrendingMusic } from "@/lib/youtube";
import { mapYouTubeVideoResult, YouTubeVideo } from "@/lib/types";
import { getRecentlyPlayed } from "@/lib/storage";
import { PlaylistSong } from "@/lib/types";

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

// Convert PlaylistSong to Song type for recently played
function playlistSongToSong(song: PlaylistSong): Song {
  return {
    videoId: song.videoId,
    title: song.title,
    channelTitle: song.channelTitle,
    thumbnail: song.thumbnail,
  };
}

// Hero visualizer component (Sleek & Minimal)
function HeroVisualizer() {
  const { isPlaying } = usePlayer();
  const barCount = 48; // Dense, smooth wave
  const [waves, setWaves] = useState<number[]>(Array(barCount).fill(0.05));

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying) {
      interval = setInterval(() => {
        setWaves(Array.from({ length: barCount }, (_, i) => {
          const position = i / barCount;
          // Create a natural looking bell curve / envelope for the sound waves
          const envelope = Math.sin(position * Math.PI); 
          return 0.05 + envelope * (Math.random() * 0.5 + 0.1);
        }));
      }, 100);
    } else {
      setWaves(Array.from({ length: barCount }, (_, i) => {
        const position = i / barCount;
        const envelope = Math.sin(position * Math.PI);
        return 0.05 + envelope * 0.05; // Base static waveform
      }));
    }

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Soft ambient background gradients */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000 ease-in-out mix-blend-screen"
        style={{
          background: isPlaying 
            ? 'radial-gradient(circle at 50% 100%, rgba(255,124,245,0.1) 0%, rgba(0,238,252,0.05) 50%, transparent 80%)'
            : 'radial-gradient(circle at 50% 100%, rgba(255,124,245,0.03) 0%, transparent 60%)',
          opacity: isPlaying ? 1 : 0.6,
        }}
      />

      {/* Subtle floating blurred orbs for depth */}
      <div className={`absolute top-0 right-1/4 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[120px] transition-all duration-[3000ms] ease-in-out ${isPlaying ? 'opacity-50 translate-y-4' : 'opacity-20'}`} />
      <div className={`absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[150px] transition-all duration-[3000ms] ease-in-out ${isPlaying ? 'opacity-50 -translate-y-4' : 'opacity-20'}`} />

      {/* Sleek audio waveform along the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-40 flex items-end justify-center gap-[2px] md:gap-1 px-4 opacity-50">
        {waves.map((intensity, i) => (
          <div
            key={`wave-${i}`}
            className="flex-1 max-w-[6px] rounded-t-sm transition-all duration-150 ease-out"
            style={{ 
              height: `${intensity * 100}%`,
              background: `linear-gradient(to top, rgba(0, 238, 252, ${0.1 + intensity * 0.3}), rgba(255, 124, 245, ${0.2 + intensity * 0.5}))`,
              boxShadow: isPlaying ? `0 0 ${4 + intensity * 10}px rgba(255,124,245,${intensity * 0.2})` : 'none',
            }}
          />
        ))}
      </div>
      
      {/* Bottom vignette fade */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
    </div>
  );
}

export default function HomePage() {
  const { playSong, addToPlaylist, playlistSongs, setPlaylistSongs } = usePlayer();
  const { isPlaying, currentSong } = usePlayer();
  const [trendingSongs, setTrendingSongs] = useState<Song[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<PlaylistSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTrendingMusic(20);
      const videos = data.items.map(mapYouTubeVideoResult);
      setTrendingSongs(videos.map(toSong));
    } catch (err: any) {
      console.error("Error fetching trending music:", err);
      setError(err.message || "Failed to load trending music");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecentlyPlayed = useCallback(() => {
    const recent = getRecentlyPlayed();
    setRecentlyPlayed(recent);
  }, []);

  // Load playlist from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("vibex_current_playlist");
      if (data) {
        try {
          const songs: Song[] = JSON.parse(data);
          setPlaylistSongs(songs);
        } catch (e) {
          console.error("Failed to load playlist:", e);
        }
      }
    }
  }, [setPlaylistSongs]);

  useEffect(() => {
    fetchTrending();
    loadRecentlyPlayed();
  }, [fetchTrending, loadRecentlyPlayed]);

  const handlePlaySong = (song: Song) => {
    playSong(song, trendingSongs);
  };

  const handlePlayRecent = (song: PlaylistSong) => {
    const songAsSong = playlistSongToSong(song);
    playSong(songAsSong, recentlyPlayed.map(playlistSongToSong));
  };

  return (
    <main className="px-6 md:px-12 py-8">
      {/* Hero Section */}
      <section className="relative w-full rounded-3xl overflow-hidden mb-12 border border-outline-variant/10 min-h-[440px] md:min-h-[500px] flex items-center justify-center bg-black">
        {/* Deep glassmorphism base */}
        <div className="absolute inset-0 bg-surface/60 backdrop-blur-xl" />
        
        {/* Sleek background visualizer */}
        <HeroVisualizer />
        
        {/* Centered Hero content */}
        <div className="relative z-10 px-6 py-16 text-center w-full max-w-4xl mx-auto flex flex-col items-center">
          {isPlaying && currentSong && (
            <div className="mb-8 inline-flex items-center gap-3 px-5 py-2 rounded-full bg-surface-variant/40 border border-outline-variant/20 backdrop-blur-md shadow-lg">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-secondary"></span>
              </span>
              <span className="text-xs font-bold text-on-surface uppercase tracking-[0.2em] truncate max-w-[200px] md:max-w-md">
                Now Playing • {currentSong.title}
              </span>
            </div>
          )}
          
          <h1 className="font-headline text-5xl md:text-[5.5rem] font-black tracking-tight mb-6 leading-tight">
            <span className="text-white drop-shadow-md">
              VibeX
            </span>
          </h1>
          
          <p className="text-on-surface-variant text-lg md:text-xl mb-10 max-w-2xl leading-relaxed font-light">
            Stream real music. Search, play, and build your playlist.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full sm:w-auto">
            <Link
              href="/search"
              className="px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] text-lg"
            >
              Start Playing
            </Link>
            <Link
              href="/playlists"
              className="px-8 py-4 rounded-full glass-panel border border-outline-variant/40 text-on-surface font-semibold hover:bg-surface-variant/60 transition-all text-lg"
            >
              Playlist ({playlistSongs.length})
            </Link>
          </div>
        </div>
      </section>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-headline text-2xl font-bold">Recently Played</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {recentlyPlayed.slice(0, 10).map((song) => (
              <SongCard
                key={song.videoId}
                song={playlistSongToSong(song)}
                onPlay={() => handlePlayRecent(song)}
                onAddToPlaylist={addToPlaylist}
                size="sm"
              />
            ))}
          </div>
        </section>
      )}

      {/* Trending Music */}
      <section>
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="font-headline text-2xl font-bold">Trending Now</h2>
          <button
            onClick={fetchTrending}
            className="text-secondary font-label text-sm uppercase tracking-widest hover:underline"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-44 flex-shrink-0 animate-pulse">
                <div className="aspect-video bg-surface-variant rounded-xl mb-3" />
                <div className="h-4 bg-surface-variant rounded w-3/4 mb-2" />
                <div className="h-3 bg-surface-variant rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchTrending}
              className="px-6 py-2 rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && trendingSongs.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
            <p>No trending songs found</p>
          </div>
        )}

        {!loading && !error && trendingSongs.length > 0 && (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {trendingSongs.map((song) => (
              <SongCard
                key={song.videoId}
                song={song}
                onPlay={handlePlaySong}
                onAddToPlaylist={addToPlaylist}
                size="md"
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
