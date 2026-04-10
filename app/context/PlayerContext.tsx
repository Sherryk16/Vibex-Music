"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { PlaylistSong } from "@/lib/types";
import { addToRecentlyPlayed } from "@/lib/storage";

// Extended song type that supports YouTube videos
export interface Song {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  thumbnailHigh?: string;
}

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  queueIndex: number;
  playSong: (song: Song, songQueue?: Song[]) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  addToPlaylist: (song: Song) => void;
  removeFromPlaylist: (videoId: string) => void;
  isInPlaylist: (videoId: string) => boolean;
  playlistSongs: Song[];
  setPlaylistSongs: (songs: Song[]) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);

  // Store the playlist in localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("vibex_current_playlist", JSON.stringify(playlistSongs));
    }
  }, [playlistSongs]);

  // Load playlist from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("vibex_current_playlist");
      if (data) {
        try {
          setPlaylistSongs(JSON.parse(data));
        } catch (e) {
          console.error("Failed to load playlist:", e);
        }
      }
    }
  }, []);

  const playSongInternal = useCallback(
    (song: Song, songQueue?: Song[]) => {
      setCurrentSong(song);
      setIsPlaying(true);

      if (songQueue && songQueue.length > 0) {
        setQueue(songQueue);
        const index = songQueue.findIndex((s) => s.videoId === song.videoId);
        setQueueIndex(index >= 0 ? index : 0);
      }

      // Add to recently played
      addToRecentlyPlayed({
        videoId: song.videoId,
        title: song.title,
        channelTitle: song.channelTitle,
        thumbnail: song.thumbnail,
        addedAt: Date.now(),
      });
    },
    []
  );

  const playSong = (song: Song, songQueue?: Song[]) => {
    playSongInternal(song, songQueue);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const playNextInternal = useCallback(() => {
    if (queue.length === 0) return;
    const nextIndex = (queueIndex + 1) % queue.length;
    const nextSong = queue[nextIndex];
    setQueueIndex(nextIndex);
    playSongInternal(nextSong);
  }, [queue, queueIndex, playSongInternal]);

  const playPreviousInternal = useCallback(() => {
    if (queue.length === 0) return;
    const prevIndex = queueIndex === 0 ? queue.length - 1 : queueIndex - 1;
    const prevSong = queue[prevIndex];
    setQueueIndex(prevIndex);
    playSongInternal(prevSong);
  }, [queue, queueIndex, playSongInternal]);

  const playNext = () => {
    playNextInternal();
  };

  const playPrevious = () => {
    playPreviousInternal();
  };

  const addToPlaylist = (song: Song) => {
    setPlaylistSongs((prev) => {
      const exists = prev.some((s) => s.videoId === song.videoId);
      if (!exists) {
        return [...prev, song];
      }
      return prev;
    });
  };

  const removeFromPlaylist = (videoId: string) => {
    setPlaylistSongs((prev) => prev.filter((s) => s.videoId !== videoId));
  };

  const isInPlaylist = (videoId: string) => {
    return playlistSongs.some((s) => s.videoId === videoId);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        queue,
        queueIndex,
        playSong,
        togglePlay,
        playNext,
        playPrevious,
        addToPlaylist,
        removeFromPlaylist,
        isInPlaylist,
        playlistSongs,
        setPlaylistSongs,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
}
