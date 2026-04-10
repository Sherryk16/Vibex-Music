// localStorage utilities for playlists and recently played songs

import { PlaylistSong, Playlist } from "../lib/types";

const PLAYLISTS_STORAGE_KEY = "vibex_playlists";
const RECENTLY_PLAYED_KEY = "vibex_recently_played";
const MAX_RECENTLY_PLAYED = 20;

/**
 * Get all playlists from localStorage
 */
export function getPlaylists(): Playlist[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(PLAYLISTS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading playlists from localStorage:", error);
    return [];
  }
}

/**
 * Save all playlists to localStorage
 */
export function savePlaylists(playlists: Playlist[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists));
  } catch (error) {
    console.error("Error saving playlists to localStorage:", error);
  }
}

/**
 * Add a song to a playlist
 */
export function addSongToPlaylist(
  playlistId: string,
  song: PlaylistSong
): Playlist[] {
  const playlists = getPlaylists();
  const playlistIndex = playlists.findIndex((p) => p.id === playlistId);

  if (playlistIndex === -1) {
    // Create new playlist if it doesn't exist
    const newPlaylist: Playlist = {
      id: playlistId,
      name: "My Playlist",
      songs: [song],
      createdAt: Date.now(),
    };
    playlists.push(newPlaylist);
  } else {
    // Check if song already exists in playlist
    const songExists = playlists[playlistIndex].songs.some(
      (s) => s.videoId === song.videoId
    );
    if (!songExists) {
      playlists[playlistIndex].songs.push(song);
    }
  }

  savePlaylists(playlists);
  return playlists;
}

/**
 * Remove a song from a playlist
 */
export function removeSongFromPlaylist(
  playlistId: string,
  videoId: string
): Playlist[] {
  const playlists = getPlaylists();
  const playlistIndex = playlists.findIndex((p) => p.id === playlistId);

  if (playlistIndex !== -1) {
    playlists[playlistIndex].songs = playlists[playlistIndex].songs.filter(
      (s) => s.videoId !== videoId
    );
    savePlaylists(playlists);
  }

  return playlists;
}

/**
 * Create a new playlist
 */
export function createPlaylist(name: string): Playlist {
  const playlists = getPlaylists();
  const newPlaylist: Playlist = {
    id: Date.now().toString(),
    name,
    songs: [],
    createdAt: Date.now(),
  };
  playlists.push(newPlaylist);
  savePlaylists(playlists);
  return newPlaylist;
}

/**
 * Delete a playlist
 */
export function deletePlaylist(playlistId: string): Playlist[] {
  const playlists = getPlaylists();
  const filtered = playlists.filter((p) => p.id !== playlistId);
  savePlaylists(filtered);
  return filtered;
}

/**
 * Rename a playlist
 */
export function renamePlaylist(
  playlistId: string,
  newName: string
): Playlist[] {
  const playlists = getPlaylists();
  const playlistIndex = playlists.findIndex((p) => p.id === playlistId);

  if (playlistIndex !== -1) {
    playlists[playlistIndex].name = newName;
    savePlaylists(playlists);
  }

  return playlists;
}

/**
 * Add a song to recently played
 */
export function addToRecentlyPlayed(song: PlaylistSong): void {
  if (typeof window === "undefined") return;
  try {
    const data = localStorage.getItem(RECENTLY_PLAYED_KEY);
    const recentlyPlayed: PlaylistSong[] = data ? JSON.parse(data) : [];

    // Remove if already exists (to move to top)
    const filtered = recentlyPlayed.filter((s) => s.videoId !== song.videoId);

    // Add to beginning
    const updated = [song, ...filtered].slice(0, MAX_RECENTLY_PLAYED);

    localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving recently played:", error);
  }
}

/**
 * Get recently played songs
 */
export function getRecentlyPlayed(): PlaylistSong[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(RECENTLY_PLAYED_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading recently played from localStorage:", error);
    return [];
  }
}

/**
 * Check if a song is in any playlist
 */
export function isSongInPlaylist(videoId: string): boolean {
  const playlists = getPlaylists();
  return playlists.some((p) => p.songs.some((s) => s.videoId === videoId));
}

/**
 * Get all playlists that contain a specific song
 */
export function getPlaylistsContainingSong(videoId: string): Playlist[] {
  const playlists = getPlaylists();
  return playlists.filter((p) => p.songs.some((s) => s.videoId === videoId));
}
