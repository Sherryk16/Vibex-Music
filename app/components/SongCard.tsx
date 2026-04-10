"use client";

import { Song } from "@/app/context/PlayerContext";

interface SongCardProps {
  song: Song;
  onPlay: (song: Song) => void;
  onAddToPlaylist?: (song: Song) => void;
  onRemoveFromPlaylist?: (videoId: string) => void;
  showRemove?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-32",
  md: "w-44",
  lg: "w-56",
};

export function SongCard({
  song,
  onPlay,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  showRemove = false,
  size = "md",
}: SongCardProps) {
  const cardWidth = sizeClasses[size];

  return (
    <div
      className={`${cardWidth} group cursor-pointer flex-shrink-0`}
      onClick={() => onPlay(song)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onPlay(song)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden mb-3 shadow-lg group-hover:shadow-[0_8px_30px_rgba(255,124,245,0.3)] transition-all duration-300">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={song.thumbnailHigh || song.thumbnail}
          alt={song.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_arrow
            </span>
          </div>
        </div>
        {/* Remove button */}
        {showRemove && onRemoveFromPlaylist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveFromPlaylist(song.videoId);
            }}
            className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-red-500/80 transition-colors"
          >
            <span className="material-symbols-outlined text-white text-sm">close</span>
          </button>
        )}
        {/* Add to playlist button */}
        {onAddToPlaylist && !showRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToPlaylist(song);
            }}
            className="absolute bottom-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors opacity-0 group-hover:opacity-100"
          >
            <span className="material-symbols-outlined text-white text-sm">add</span>
          </button>
        )}
      </div>
      {/* Info */}
      <h4 className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors truncate">
        {song.title}
      </h4>
      <p className="text-xs text-on-surface-variant mt-1 truncate">
        {song.channelTitle}
      </p>
    </div>
  );
}
