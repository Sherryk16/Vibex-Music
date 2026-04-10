"use client";

import { useEffect, useState, useCallback } from "react";
import { usePlayer, Song } from "@/app/context/PlayerContext";
import { SongCard } from "@/app/components/SongCard";
import { searchMusic, getTrendingMusic } from "@/lib/youtube";
import { mapYouTubeVideo, mapYouTubeVideoResult, YouTubeVideo } from "@/lib/types";
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

// Mood categories with curated search queries
const moods = [
  {
    id: "chill",
    name: "Chill Vibes",
    icon: "self_improvement",
    gradient: "from-teal-500/20 to-blue-500/20",
    queries: ["lofi hip hop", "chill beats", "relaxing music", "ambient music"],
  },
  {
    id: "workout",
    name: "Workout Energy",
    icon: "fitness_center",
    gradient: "from-red-500/20 to-orange-500/20",
    queries: ["workout music", "gym motivation", "edm bangers", "rock anthems"],
  },
  {
    id: "focus",
    name: "Deep Focus",
    icon: "psychology",
    gradient: "from-purple-500/20 to-indigo-500/20",
    queries: ["study music", "concentration music", "deep focus beats", "classical study"],
  },
  {
    id: "party",
    name: "Party Mix",
    icon: "celebration",
    gradient: "from-pink-500/20 to-yellow-500/20",
    queries: ["party hits 2024", "dance music", "pop hits", "club bangers"],
  },
  {
    id: "romantic",
    name: "Romantic",
    icon: "favorite",
    gradient: "from-rose-500/20 to-pink-500/20",
    queries: ["love songs", "romantic ballads", "r&b slow jams", "acoustic love"],
  },
  {
    id: "throwback",
    name: "Throwbacks",
    icon: "history",
    gradient: "from-amber-500/20 to-orange-500/20",
    queries: ["2000s hits", "90s nostalgia", "classic rock", "old school hip hop"],
  },
];

// Genre categories
const genres = [
  { name: "Pop", query: "top pop hits 2024", color: "bg-pink-500" },
  { name: "Hip Hop", query: "best hip hop 2024", color: "bg-yellow-500" },
  { name: "R&B", query: "top r&b songs 2024", color: "bg-purple-500" },
  { name: "Rock", query: "best rock songs 2024", color: "bg-red-500" },
  { name: "EDM", query: "top edm drops 2024", color: "bg-cyan-500" },
  { name: "Indie", query: "best indie music 2024", color: "bg-green-500" },
  { name: "Jazz", query: "smooth jazz playlist", color: "bg-amber-500" },
  { name: "Classical", query: "best classical music", color: "bg-blue-500" },
];

// Time-based greeting
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}

// Get time-based recommendation label
function getTimeBasedLabel() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return "Morning Kickstart";
  if (hour >= 10 && hour < 14) return "Midday Energy";
  if (hour >= 14 && hour < 18) return "Afternoon Groove";
  if (hour >= 18 && hour < 22) return "Evening Vibes";
  return "Late Night Chill";
}

export default function ForYouPage() {
  const { playSong, addToPlaylist } = usePlayer();
  const [moodResults, setMoodResults] = useState<Record<string, Song[]>>({});
  const [genreResults, setGenreResults] = useState<Record<string, Song[]>>({});
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [timeBasedPicks, setTimeBasedPicks] = useState<Song[]>([]);
  const [dailyMix, setDailyMix] = useState<Song[]>([]);
  const [listeningBased, setListeningBased] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecentlyPlayed = useCallback(() => {
    const recent = getRecentlyPlayed();
    const songs: Song[] = recent.slice(0, 10).map(r => ({
      videoId: r.videoId,
      title: r.title,
      channelTitle: r.channelTitle,
      thumbnail: r.thumbnail,
    }));
    setRecentlyPlayed(songs);
  }, []);

  const fetchMoodMusic = useCallback(async () => {
    const results: Record<string, Song[]> = {};

    // Fetch only 2 random moods instead of 3 to save quota
    const shuffledMoods = [...moods].sort(() => Math.random() - 0.5).slice(0, 2);

    for (const mood of shuffledMoods) {
      const randomQuery = mood.queries[Math.floor(Math.random() * mood.queries.length)];
      try {
        // Fetch fewer results (6 instead of 10)
        const data = await searchMusic(randomQuery, 6);
        const videos = data.items.map(mapYouTubeVideo);
        results[mood.id] = videos.map(toSong);
      } catch (err) {
        console.error(`Error fetching ${mood.name}:`, err);
        results[mood.id] = [];
      }
    }

    setMoodResults(results);
  }, []);

  const fetchGenreMusic = useCallback(async () => {
    const results: Record<string, Song[]> = {};

    // Fetch only 2 random genres instead of 4 to save quota
    const shuffledGenres = [...genres].sort(() => Math.random() - 0.5).slice(0, 2);

    for (const genre of shuffledGenres) {
      try {
        // Fetch fewer results (6 instead of 10)
        const data = await searchMusic(genre.query, 6);
        const videos = data.items.map(mapYouTubeVideo);
        results[genre.name] = videos.map(toSong);
      } catch (err) {
        console.error(`Error fetching ${genre.name}:`, err);
        results[genre.name] = [];
      }
    }

    setGenreResults(results);
  }, []);

  const fetchTimeBasedPicks = useCallback(async () => {
    try {
      const hour = new Date().getHours();
      let query = "trending music";

      if (hour >= 6 && hour < 10) query = "morning energy music";
      else if (hour >= 10 && hour < 14) query = "midday motivation music";
      else if (hour >= 14 && hour < 18) query = "afternoon chill music";
      else if (hour >= 18 && hour < 22) query = "evening vibes music";
      else query = "late night relaxing music";

      // Fetch fewer results (6 instead of 10)
      const data = await searchMusic(query, 6);
      const videos = data.items.map(mapYouTubeVideo);
      setTimeBasedPicks(videos.map(toSong));
    } catch (err) {
      console.error("Error fetching time-based picks:", err);
    }
  }, []);

  const fetchDailyMix = useCallback(async () => {
    try {
      // Mix of trending and popular - fetch fewer (8 instead of 15)
      const data = await getTrendingMusic(8);
      const videos = data.items.map(mapYouTubeVideoResult);
      setDailyMix(videos.map(toSong));
    } catch (err) {
      console.error("Error fetching daily mix:", err);
    }
  }, []);

  const fetchListeningBasedRecommendations = useCallback(async () => {
    if (recentlyPlayed.length === 0) return;

    try {
      const recommendations: Song[] = [];
      const usedVideoIds = new Set(recentlyPlayed.map(s => s.videoId));

      // Strategy 1: Search for more songs by the same artists (limit to 2 artists, 4 results each)
      const topArtists = [...new Set(recentlyPlayed.map(s => s.channelTitle))].slice(0, 2);

      for (const artist of topArtists) {
        try {
          const data = await searchMusic(`${artist} best songs`, 4);
          const videos = data.items.map(mapYouTubeVideo).map(toSong);

          for (const song of videos) {
            if (!usedVideoIds.has(song.videoId) && recommendations.length < 10) {
              recommendations.push(song);
              usedVideoIds.add(song.videoId);
            }
          }
        } catch (err) {
          console.error(`Error fetching ${artist}:`, err);
        }
      }

      // Only do Strategies 2 & 3 if we have enough quota and recommendations
      if (recommendations.length < 5) {
        // Strategy 2: Extract keywords from song titles (limit to 2 keywords)
        const keywords = recentlyPlayed
          .flatMap(s => {
            const words = s.title.toLowerCase().split(/\s+/);
            return words.filter(w =>
              w.length > 3 &&
              !['feat', 'official', 'video', 'audio', 'lyrics', 'music', 'song'].includes(w)
            );
          });

        const topKeywords = [...new Set(keywords)].slice(0, 2);

        for (const keyword of topKeywords) {
          try {
            const data = await searchMusic(`${keyword} music`, 4);
            const videos = data.items.map(mapYouTubeVideo).map(toSong);

            for (const song of videos) {
              if (!usedVideoIds.has(song.videoId) && recommendations.length < 10) {
                recommendations.push(song);
                usedVideoIds.add(song.videoId);
              }
            }
          } catch (err) {
            console.error(`Error fetching ${keyword}:`, err);
          }
        }
      }

      setListeningBased(recommendations.slice(0, 10));
    } catch (err) {
      console.error("Error generating listening-based recommendations:", err);
    }
  }, [recentlyPlayed]);

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);

      loadRecentlyPlayed();

      try {
        await Promise.all([
          fetchMoodMusic(),
          fetchGenreMusic(),
          fetchTimeBasedPicks(),
          fetchDailyMix(),
        ]);
      } catch (err) {
        setError("Failed to load some recommendations");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [loadRecentlyPlayed, fetchMoodMusic, fetchGenreMusic, fetchTimeBasedPicks, fetchDailyMix]);

  // Load listening-based recommendations after recently played is loaded
  useEffect(() => {
    if (recentlyPlayed.length > 0) {
      fetchListeningBasedRecommendations();
    }
  }, [recentlyPlayed, fetchListeningBasedRecommendations]);

  const handlePlaySong = (song: Song, queue: Song[]) => {
    playSong(song, queue);
  };

  if (loading) {
    return (
      <main className="px-6 md:px-12 py-8">
        <div className="animate-pulse">
          <div className="h-12 bg-surface-variant rounded w-96 mb-4" />
          <div className="h-6 bg-surface-variant rounded w-64 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i}>
                <div className="aspect-video bg-surface-variant rounded-xl mb-3" />
                <div className="h-4 bg-surface-variant rounded w-3/4 mb-2" />
                <div className="h-3 bg-surface-variant rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 md:px-12 py-8 pb-32">
      {/* Header with greeting */}
      <section className="mb-12">
        <h1 className="font-headline text-4xl md:text-5xl font-black tracking-tight mb-2">
          {getGreeting()}
          <span className="ml-3 inline-block animate-bounce">👋</span>
        </h1>
        <p className="text-on-surface-variant text-lg">
          Personalized recommendations just for you
        </p>
      </section>

      {error && (
        <div className="mb-6 p-4 bg-error-container/20 border border-error-container/30 rounded-xl">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* Listening History Based Recommendations */}
      {listeningBased.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center relative">
              <span className="material-symbols-outlined text-white text-xl">
                recommendations
              </span>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full animate-pulse" />
            </div>
            <div>
              <h2 className="font-headline text-2xl font-bold">Because You Listened</h2>
              <p className="text-xs text-on-surface-variant">Based on your recent listening history</p>
            </div>
          </div>
          
          {/* What you listened to */}
          <div className="mb-6">
            <p className="text-sm font-medium text-on-surface-variant mb-3">Your recent picks:</p>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {recentlyPlayed.slice(0, 6).map((song) => (
                <div
                  key={song.videoId}
                  className="flex-shrink-0 w-28 group"
                  onClick={() => handlePlaySong(song, recentlyPlayed)}
                  role="button"
                  tabIndex={0}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={song.thumbnailHigh || song.thumbnail}
                    alt={song.title}
                    className="w-28 h-16 rounded-lg object-cover mb-2 ring-2 ring-outline-variant/20 group-hover:ring-primary/50 transition-all"
                  />
                  <p className="text-xs font-medium text-on-surface truncate">{song.title}</p>
                  <p className="text-[10px] text-on-surface-variant truncate">{song.channelTitle}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {listeningBased.map((song) => (
              <SongCard
                key={song.videoId}
                song={song}
                onPlay={(s) => handlePlaySong(s, listeningBased)}
                onAddToPlaylist={addToPlaylist}
                size="md"
              />
            ))}
          </div>
        </section>
      )}

      {/* Time-based Picks */}
      {timeBasedPicks.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">
                schedule
              </span>
            </div>
            <div>
              <h2 className="font-headline text-2xl font-bold">{getTimeBasedLabel()}</h2>
              <p className="text-xs text-on-surface-variant">Curated for this time of day</p>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {timeBasedPicks.map((song) => (
              <SongCard
                key={song.videoId}
                song={song}
                onPlay={(s) => handlePlaySong(s, timeBasedPicks)}
                onAddToPlaylist={addToPlaylist}
                size="md"
              />
            ))}
          </div>
        </section>
      )}

      {/* Daily Mix */}
      {dailyMix.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">
                auto_awesome
              </span>
            </div>
            <div>
              <h2 className="font-headline text-2xl font-bold">Daily Mix</h2>
              <p className="text-xs text-on-surface-variant">Today's trending picks</p>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {dailyMix.map((song) => (
              <SongCard
                key={song.videoId}
                song={song}
                onPlay={(s) => handlePlaySong(s, dailyMix)}
                onAddToPlaylist={addToPlaylist}
                size="md"
              />
            ))}
          </div>
        </section>
      )}

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">
                history
              </span>
            </div>
            <div>
              <h2 className="font-headline text-2xl font-bold">Pick Up Where You Left Off</h2>
              <p className="text-xs text-on-surface-variant">Your recently played songs</p>
            </div>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
            {recentlyPlayed.map((song) => (
              <SongCard
                key={song.videoId}
                song={song}
                onPlay={(s) => handlePlaySong(s, recentlyPlayed)}
                onAddToPlaylist={addToPlaylist}
                size="sm"
              />
            ))}
          </div>
        </section>
      )}

      {/* Mood-based Recommendations */}
      {Object.keys(moodResults).length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">
                mood
              </span>
            </div>
            <div>
              <h2 className="font-headline text-2xl font-bold">Match Your Mood</h2>
              <p className="text-xs text-on-surface-variant">Music for how you feel right now</p>
            </div>
          </div>
          
          {/* Mood selector chips */}
          <div className="flex gap-3 mb-6 overflow-x-auto no-scrollbar">
            {moods.map((mood) => {
              const hasResults = moodResults[mood.id] && moodResults[mood.id].length > 0;
              return (
                <button
                  key={mood.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${mood.gradient} border border-outline-variant/20 hover:scale-105 active:scale-95 transition-all flex-shrink-0 ${
                    hasResults ? 'ring-1 ring-primary/30' : 'opacity-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{mood.icon}</span>
                  <span className="text-sm font-medium">{mood.name}</span>
                </button>
              );
            })}
          </div>

          {/* Mood results */}
          {Object.entries(moodResults).map(([moodId, songs]) => {
            if (songs.length === 0) return null;
            const mood = moods.find(m => m.id === moodId);
            if (!mood) return null;
            
            return (
              <div key={moodId} className="mb-6">
                <h3 className="font-headline text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">{mood.icon}</span>
                  {mood.name}
                </h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                  {songs.map((song) => (
                    <SongCard
                      key={song.videoId}
                      song={song}
                      onPlay={(s) => handlePlaySong(s, songs)}
                      onAddToPlaylist={addToPlaylist}
                      size="md"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Genre-based Recommendations */}
      {Object.keys(genreResults).length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">
                library_music
              </span>
            </div>
            <div>
              <h2 className="font-headline text-2xl font-bold">Discover Genres</h2>
              <p className="text-xs text-on-surface-variant">Explore new sounds and artists</p>
            </div>
          </div>
          
          {/* Genre chips */}
          <div className="flex gap-3 mb-6 overflow-x-auto no-scrollbar">
            {genres.map((genre) => {
              const hasResults = genreResults[genre.name] && genreResults[genre.name].length > 0;
              return (
                <button
                  key={genre.name}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full bg-surface-variant/50 border border-outline-variant/20 hover:scale-105 active:scale-95 transition-all flex-shrink-0 ${
                    hasResults ? 'ring-1 ring-secondary/30' : 'opacity-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${genre.color}`} />
                  <span className="text-sm font-medium">{genre.name}</span>
                </button>
              );
            })}
          </div>

          {/* Genre results */}
          {Object.entries(genreResults).map(([genreName, songs]) => {
            if (songs.length === 0) return null;
            const genre = genres.find(g => g.name === genreName);
            
            return (
              <div key={genreName} className="mb-6">
                <h3 className="font-headline text-lg font-bold mb-4 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${genre?.color || 'bg-primary'}`} />
                  {genreName}
                </h3>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                  {songs.map((song) => (
                    <SongCard
                      key={song.videoId}
                      song={song}
                      onPlay={(s) => handlePlaySong(s, songs)}
                      onAddToPlaylist={addToPlaylist}
                      size="md"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Empty state */}
      {!loading && Object.keys(moodResults).length === 0 && Object.keys(genreResults).length === 0 && (
        <div className="text-center py-24">
          <span className="material-symbols-outlined text-8xl text-on-surface-variant/30 mb-6">
            music_off
          </span>
          <h2 className="font-headline text-2xl font-bold mb-2">Couldn't load recommendations</h2>
          <p className="text-on-surface-variant mb-6">
            Please check your API key and try again
          </p>
        </div>
      )}
    </main>
  );
}
