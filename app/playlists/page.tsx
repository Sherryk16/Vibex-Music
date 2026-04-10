"use client";

import { useState, useEffect } from "react";
import { usePlayer, Song } from "@/app/context/PlayerContext";
import { SongCard } from "@/app/components/SongCard";

export default function PlaylistsPage() {
  const {
    playlistSongs,
    setPlaylistSongs,
    playSong,
    removeFromPlaylist,
  } = usePlayer();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load playlist from localStorage on mount
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

  const handlePlaySong = (song: Song) => {
    playSong(song, playlistSongs);
  };

  const handleRemoveSong = (videoId: string) => {
    const updated = playlistSongs.filter((s) => s.videoId !== videoId);
    setPlaylistSongs(updated);
    localStorage.setItem("vibex_current_playlist", JSON.stringify(updated));
  };

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      playSong(playlistSongs[0], playlistSongs);
    }
  };

  const handleClearPlaylist = () => {
    if (confirm("Are you sure you want to clear your playlist?")) {
      setPlaylistSongs([]);
      localStorage.setItem("vibex_current_playlist", "[]");
    }
  };

  if (!isClient) {
    return (
      <main className="px-6 md:px-12 py-8">
        <div className="animate-pulse">
          <div className="h-10 bg-surface-variant rounded w-64 mb-4" />
          <div className="h-4 bg-surface-variant rounded w-96 mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
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
    <main className="px-6 md:px-12 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-headline text-3xl md:text-4xl font-bold mb-2">
            My Playlist
          </h1>
          <p className="text-on-surface-variant">
            {playlistSongs.length} {playlistSongs.length === 1 ? "song" : "songs"}
          </p>
        </div>
        <div className="flex gap-3">
          {playlistSongs.length > 0 && (
            <>
              <button
                onClick={handlePlayAll}
                className="px-6 py-3 rounded-full bg-primary text-on-primary font-bold hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
                Play All
              </button>
              <button
                onClick={handleClearPlaylist}
                className="px-4 py-3 rounded-full glass-panel border-outline-variant/30 text-on-surface font-bold hover:bg-surface-variant/50 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Empty state */}
      {playlistSongs.length === 0 && (
        <div className="text-center py-24">
          <span className="material-symbols-outlined text-8xl text-on-surface-variant/30 mb-6">
            queue_music
          </span>
          <h2 className="font-headline text-2xl font-bold mb-2">
            Your playlist is empty
          </h2>
          <p className="text-on-surface-variant mb-6">
            Search for songs and add them to your playlist
          </p>
          <a
            href="/search"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            <span className="material-symbols-outlined">search</span>
            Search Music
          </a>
        </div>
      )}

      {/* Playlist songs */}
      {playlistSongs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
          {playlistSongs.map((song) => (
            <SongCard
              key={song.videoId}
              song={song}
              onPlay={handlePlaySong}
              onRemoveFromPlaylist={handleRemoveSong}
              showRemove={true}
              size="md"
            />
          ))}
        </div>
      )}
    </main>
  );
}
