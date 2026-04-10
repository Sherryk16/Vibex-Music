"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayer, Song } from "../context/PlayerContext";
import { searchMusic } from "@/lib/youtube";
import { mapYouTubeVideo, YouTubeVideo, YouTubeSearchResponse } from "@/lib/types";

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

export function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { playSong } = usePlayer();

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const data: YouTubeSearchResponse = await searchMusic(searchQuery, 20);
      const videos = data.items.map(mapYouTubeVideo);
      setSearchResults(videos.map(toSong));
    } catch (err: any) {
      console.error("Error searching music:", err);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaySong = (song: Song) => {
    playSong(song, searchResults);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose}></div>

      {/* Search Panel */}
      <div className="relative w-full max-w-2xl bg-[#191919]/90 backdrop-blur-2xl rounded-3xl border border-[#484848]/30 shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-[#484848]/30">
          <span className="material-symbols-outlined text-[#ababab] text-3xl">search</span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="Search songs, artists, albums..."
            className="flex-1 bg-transparent text-on-surface text-lg font-body outline-none placeholder:text-[#ababab]"
            autoFocus
          />
          <button
            onClick={onClose}
            className="material-symbols-outlined text-[#ababab] hover:text-white transition-colors cursor-pointer"
          >
            close
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {query.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <span className="material-symbols-outlined text-[#484848] text-6xl mb-4">music_note</span>
              <p className="text-[#ababab] font-label">Start typing to search the sonic space</p>
            </div>
          ) : isLoading ? (
            <div className="px-6 py-16 text-center">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
              <p className="text-[#ababab] font-label mt-4">Searching...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <span className="material-symbols-outlined text-[#484848] text-6xl mb-4">search_off</span>
              <p className="text-[#ababab] font-label">No results found for &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="py-4">
              {searchResults.map((song) => (
                <div
                  key={song.videoId}
                  onClick={() => handlePlaySong(song)}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-[#262626]/50 cursor-pointer transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={song.thumbnailHigh || song.thumbnail} alt={song.title} className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-on-surface truncate">{song.title}</h4>
                    <p className="text-xs text-[#ababab] truncate">{song.channelTitle}</p>
                  </div>
                  <span className="material-symbols-outlined text-primary text-xl">play_arrow</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
