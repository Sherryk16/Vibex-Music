"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePlayer, Song } from "@/app/context/PlayerContext";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Audio visualizer component
function AudioVisualizer({ isPlaying, beatIntensity }: { isPlaying: boolean; beatIntensity: number }) {
  const bars = 24;
  
  return (
    <div className="flex items-end justify-center gap-[2px] h-16 px-4">
      {Array.from({ length: bars }).map((_, i) => {
        const delay = i * 0.05;
        const height = isPlaying
          ? `${Math.random() * 60 + 20 + beatIntensity * 30}%`
          : "10%";
        
        return (
          <div
            key={i}
            className="w-1.5 bg-gradient-to-t from-primary/50 to-primary rounded-full transition-all duration-150 ease-out"
            style={{
              height,
              animationDelay: `${delay}s`,
              animation: isPlaying ? `pulse 0.8s ease-in-out ${delay}s infinite alternate` : "none",
            }}
          />
        );
      })}
    </div>
  );
}

// Mini player for when playlist panel is open
function MiniPlayer({ 
  song, 
  isPlaying, 
  onTogglePlay 
}: { 
  song: Song; 
  isPlaying: boolean; 
  onTogglePlay: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-surface-container border-t border-outline-variant/10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={song.thumbnailHigh || song.thumbnail}
        alt={song.title}
        className="w-10 h-10 rounded-lg object-cover"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-on-surface truncate">{song.title}</p>
        <p className="text-xs text-on-surface-variant truncate">{song.channelTitle}</p>
      </div>
      <button
        onClick={onTogglePlay}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-primary"
      >
        <span
          className="material-symbols-outlined text-white text-sm"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {isPlaying ? "pause" : "play_arrow"}
        </span>
      </button>
    </div>
  );
}

export function YouTubePlayer() {
  const { currentSong, playNext, playPrevious, playlistSongs, queue, playSong, addToPlaylist } =
    usePlayer();
  const router = useRouter();
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const visualizerRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const isInitializedRef = useRef(false);
  const currentSongRef = useRef<string | null>(null);

  // Player state management
  const [playerState, setPlayerState] = useState<'idle' | 'buffering' | 'playing' | 'paused'>('idle');
  const [beatIntensity, setBeatIntensity] = useState(0);
  const playerStateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const beatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start polling player state for accurate UI updates
  const startPlayerStatePolling = () => {
    stopPlayerStatePolling();
    playerStateIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getPlayerState && isPlayerReady) {
        try {
          const state = playerRef.current.getPlayerState();
          if (state === window.YT?.PlayerState?.PLAYING) {
            setPlayerState('playing');
          } else if (state === window.YT?.PlayerState?.PAUSED) {
            setPlayerState('paused');
          } else if (state === window.YT?.PlayerState?.BUFFERING || state === window.YT?.PlayerState?.CUED) {
            setPlayerState('buffering');
          } else {
            setPlayerState('idle');
          }
        } catch (e) {
          // Player might be in invalid state
        }
      }
    }, 200);
  };

  const stopPlayerStatePolling = () => {
    if (playerStateIntervalRef.current) {
      clearInterval(playerStateIntervalRef.current);
      playerStateIntervalRef.current = null;
    }
  };

  // Beat intensity simulation
  useEffect(() => {
    if (playerState === 'playing') {
      beatIntervalRef.current = setInterval(() => {
        setBeatIntensity(Math.random() * 0.8 + 0.2);
      }, 200);
    } else {
      setBeatIntensity(0);
    }

    return () => {
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
      }
    };
  }, [playerState]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (!isHovering && playerState === 'playing') {
      timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => clearTimeout(timeout);
  }, [isHovering, playerState]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (isInitializedRef.current) return;

    const initializeAPI = () => {
      if (!window.YT) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };

      if (window.YT && window.YT.Player) {
        initializePlayer();
      }
    };

    initializeAPI();

    return () => {
      stopProgressTracking();
    };
  }, []);

  const initializePlayer = () => {
    if (!containerRef.current || isInitializedRef.current) return;
    isInitializedRef.current = true;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: "1",
      width: "1",
      playerVars: {
        autoplay: 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        origin: window.location.origin,
        playsinline: 1,
        enablejsapi: 1,
      },
      events: {
        onReady: () => {
          setIsPlayerReady(true);
          setVolume(playerRef.current.getVolume?.() || 80);
          startPlayerStatePolling();
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setPlayerState('playing');
            startProgressTracking();
          } else if (event.data === window.YT.PlayerState.PAUSED) {
            setPlayerState('paused');
            stopProgressTracking();
          } else if (event.data === window.YT.PlayerState.ENDED) {
            setPlayerState('idle');
            stopProgressTracking();
            playNext();
          } else if (event.data === window.YT.PlayerState.BUFFERING || event.data === window.YT.PlayerState.CUED) {
            setPlayerState('buffering');
          }
        },
        onError: (event: any) => {
          console.warn("YouTube player error:", event.data, "- Current song:", currentSong?.title);

          const isFatalError = [100, 101, 150, 105052, 5].includes(event.data);

          if (isFatalError) {
            setPlayerState('idle');
            stopProgressTracking();
            playNext();
          }
        },
      },
    });
  };

  // Load and play video when currentSong changes
  useEffect(() => {
    if (currentSong && isPlayerReady && playerRef.current) {
      currentSongRef.current = currentSong.videoId;
      setCurrentTime(0);
      setDuration(0);
      setPlayerState('buffering');
      setShowControls(true);

      try {
        if (playerRef.current.loadVideoById) {
          playerRef.current.loadVideoById(currentSong.videoId);
          playerRef.current.setVolume(volume);
        }
      } catch (e) {
        console.error("Error loading video:", e);
        setPlayerState('paused');
      }
    }
  }, [currentSong, isPlayerReady, volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressTracking();
      stopPlayerStatePolling();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSkipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSkipForward();
          break;
        case 'ArrowUp':
          e.preventDefault();
          updateVolume(volume + 5);
          break;
        case 'ArrowDown':
          e.preventDefault();
          updateVolume(volume - 5);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, playerState]);

  const startProgressTracking = () => {
    stopProgressTracking();
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current && playerRef.current.getCurrentTime) {
        try {
          const time = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (time > 0) {
            setCurrentTime(time);
            setDuration(dur);
          }
        } catch (e) {
          // Player might be in invalid state
        }
      }
    }, 250);
  };

  const stopProgressTracking = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handlePlayPause = () => {
    if (!playerRef.current || !isPlayerReady) return;
    setShowControls(true);

    try {
      const playerStateValue = playerRef.current.getPlayerState();
      const isCurrentlyPlaying = playerStateValue === window.YT?.PlayerState?.PLAYING;

      if (isCurrentlyPlaying) {
        playerRef.current.pauseVideo();
        setPlayerState('paused');
      } else {
        playerRef.current.playVideo();
        setPlayerState('buffering');
      }
    } catch (e) {
      console.error("Error toggling play/pause:", e);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseInt(e.target.value);
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(time, true);
      setCurrentTime(time);
      if (playerState === 'paused') {
        playerRef.current.playVideo();
      }
    }
  };

  const handleSkipBackward = () => {
    if (!playerRef.current || !isPlayerReady) return;
    setShowControls(true);
    try {
      const newTime = Math.max(0, currentTime - 5);
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
    } catch (e) {
      console.error("Error skipping backward:", e);
    }
  };

  const handleSkipForward = () => {
    if (!playerRef.current || !isPlayerReady) return;
    setShowControls(true);
    try {
      const newTime = Math.min(duration, currentTime + 5);
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
    } catch (e) {
      console.error("Error skipping forward:", e);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    updateVolume(vol);
  };

  const updateVolume = (vol: number) => {
    const newVolume = Math.max(0, Math.min(100, vol));
    setVolume(newVolume);
    if (playerRef.current && playerRef.current.setVolume) {
      try {
        playerRef.current.setVolume(newVolume);
      } catch (e) {
        console.warn("Error setting volume:", e);
      }
    }
  };

  const handleDownload = () => {
    if (!currentSong) return;
    router.push(`/download?id=${currentSong.videoId}`);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get queue for display
  const displayQueue = queue.length > 0 ? queue : playlistSongs;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentSong) {
    return (
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-50 bg-surface-container-low/90 backdrop-blur-2xl border-t border-outline-variant/10">
        <div className="hidden">
          <div ref={containerRef} id="youtube-player" />
        </div>
        <div className="max-w-screen-xl mx-auto px-6 py-6 flex items-center justify-center text-on-surface-variant">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-30">
              music_note
            </span>
            <p className="text-sm">Select a song to start playing</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-50 bg-surface-container-low/90 backdrop-blur-2xl border-t border-outline-variant/10 transition-all duration-300"
      onMouseEnter={() => {
        setIsHovering(true);
        setShowControls(true);
      }}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Hidden YouTube player */}
      <div className="hidden">
        <div ref={containerRef} id="youtube-player" />
      </div>

      {/* Animated background glow */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(255, 124, 245, ${beatIntensity * 0.3}) 0%, transparent 70%)`,
        }}
      />

      {/* Progress bar - full width */}
      <div className="relative w-full px-4 pt-3 pb-1">
        <div className="relative h-1 bg-surface-variant rounded-full overflow-hidden group cursor-pointer">
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>
      </div>

      {/* Audio Visualizer */}
      <div ref={visualizerRef} className="px-4 py-2">
        <AudioVisualizer isPlaying={playerState === 'playing'} beatIntensity={beatIntensity} />
      </div>

      {/* Main controls area */}
      <div 
        className={`max-w-screen-xl mx-auto px-6 py-4 transition-all duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between gap-6">
          {/* Song info - left side */}
          <div className="flex items-center gap-4 flex-1 min-w-0 max-w-md group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSong.thumbnailHigh || currentSong.thumbnail}
              alt={currentSong.title}
              className={`w-14 h-14 rounded-xl object-cover shadow-xl flex-shrink-0 ring-2 ring-primary/20 transition-transform duration-300 ${
                playerState === 'playing' ? 'scale-100' : 'scale-95'
              }`}
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-bold text-on-surface truncate leading-tight group-hover:text-primary transition-colors">
                {currentSong.title}
              </h4>
              <p className="text-sm text-on-surface-variant truncate leading-tight mt-1">
                {currentSong.channelTitle}
              </p>
            </div>
            {/* Action buttons */}
            <div className="flex-shrink-0 flex items-center gap-1">
              <button
                onClick={() => addToPlaylist(currentSong)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant/50 active:scale-90 transition-all"
                title="Add to playlist"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-xl">
                  add
                </span>
              </button>
              <button
                onClick={handleDownload}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-variant/50 active:scale-90 transition-all"
                title="Download"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-xl">
                  download
                </span>
              </button>
            </div>
          </div>

          {/* Centered controls */}
          <div className="flex items-center gap-2">
            {/* Track navigation */}
            <div className="flex items-center gap-1">
              <button
                onClick={playPrevious}
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-variant/50 active:bg-surface-variant active:scale-90 transition-all"
                title="Previous track"
              >
                <span className="material-symbols-outlined text-on-surface text-xl">
                  skip_previous
                </span>
              </button>

              {/* Skip backward */}
              <button
                onClick={handleSkipBackward}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50 active:bg-surface-variant active:scale-90 transition-all"
                title="Back 5 seconds"
              >
                <span className="material-symbols-outlined text-on-surface text-base">
                  replay_5
                </span>
              </button>
            </div>

            {/* Play/Pause - prominent */}
            <button
              onClick={handlePlayPause}
              className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary/90 to-secondary hover:from-primary/90 hover:to-secondary/90 active:scale-95 transition-all shadow-xl shadow-primary/30 relative mx-2"
              disabled={playerState === 'buffering'}
              title={playerState === 'buffering' ? 'Loading...' : playerState === 'playing' ? 'Pause' : 'Play'}
            >
              {playerState === 'buffering' ? (
                <div className="w-8 h-8 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span
                  className="material-symbols-outlined text-white text-4xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {playerState === 'playing' ? "pause" : "play_arrow"}
                </span>
              )}
              {/* Pulsing ring when playing */}
              {playerState === 'playing' && (
                <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping opacity-20" />
              )}
            </button>

            {/* Skip forward and next track */}
            <div className="flex items-center gap-1">
              {/* Skip forward */}
              <button
                onClick={handleSkipForward}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant/50 active:bg-surface-variant active:scale-90 transition-all"
                title="Forward 5 seconds"
              >
                <span className="material-symbols-outlined text-on-surface text-base">
                  forward_5
                </span>
              </button>

              <button
                onClick={playNext}
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-variant/50 active:bg-surface-variant active:scale-90 transition-all"
                title="Next track"
              >
                <span className="material-symbols-outlined text-on-surface text-xl">
                  skip_next
                </span>
              </button>
            </div>
          </div>

          {/* Right side - Volume, time and playlist */}
          <div className="hidden md:flex items-center gap-4 flex-1 max-w-md justify-end">
            {/* Time display */}
            <div className="text-right">
              <p className="text-xs font-mono text-on-surface-variant tabular-nums">
                {formatTime(currentTime)} / {formatDuration(duration)}
              </p>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 group">
              <button
                onClick={() => setVolume(volume === 0 ? 80 : 0)}
                className="w-8 h-8 flex items-center justify-center hover:bg-surface-variant/50 rounded-full transition-colors"
                title={volume === 0 ? 'Unmute' : 'Mute'}
              >
                <span className="material-symbols-outlined text-on-surface-variant text-lg group-hover:text-on-surface transition-colors">
                  {volume === 0 ? "volume_off" : volume < 50 ? "volume_down" : "volume_up"}
                </span>
              </button>
              <div className="w-24 h-1.5 bg-surface-variant rounded-full overflow-hidden relative">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                  style={{ width: `${volume}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={handleVolumeChange}
                  className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
            </div>

            {/* Playlist toggle */}
            {displayQueue.length > 0 && (
              <button
                onClick={() => setShowPlaylist(!showPlaylist)}
                className={`relative w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                  showPlaylist
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-surface-variant/50 text-on-surface-variant hover:text-on-surface"
                }`}
                title="View queue"
              >
                <span className="material-symbols-outlined text-xl">queue_music</span>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface-container-low">
                  {displayQueue.length}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mini player when playlist is open */}
      {showPlaylist && (
        <MiniPlayer 
          song={currentSong} 
          isPlaying={playerState === 'playing'} 
          onTogglePlay={handlePlayPause} 
        />
      )}

      {/* Queue/Playlist panel */}
      {showPlaylist && displayQueue.length > 0 && (
        <div className="absolute bottom-full right-0 w-96 max-h-[70vh] bg-surface-container/95 backdrop-blur-xl border border-outline-variant/10 rounded-t-2xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between">
            <h3 className="font-bold text-on-surface text-lg">Queue</h3>
            <span className="text-xs text-on-surface-variant font-medium px-2 py-1 bg-surface-variant rounded-full">
              {displayQueue.length} songs
            </span>
          </div>
          <div className="overflow-y-auto max-h-[calc(70vh-4rem)] p-2 space-y-1">
            {displayQueue.map((song: Song, index: number) => (
              <div
                key={song.videoId}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  song.videoId === currentSong.videoId 
                    ? "bg-primary/10 ring-1 ring-primary/30" 
                    : "hover:bg-surface-variant/50"
                }`}
                onClick={() => {
                  const songToPlay = displayQueue[index];
                  playSong(songToPlay, displayQueue);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="relative flex-shrink-0">
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  {song.videoId === currentSong.videoId && playerState === 'playing' && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <div className="flex items-end gap-0.5 h-4">
                        <div className="w-0.5 bg-primary animate-pulse h-full" style={{ animationDelay: '0s' }} />
                        <div className="w-0.5 bg-primary animate-pulse h-3/4" style={{ animationDelay: '0.15s' }} />
                        <div className="w-0.5 bg-primary animate-pulse h-1/2" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${
                    song.videoId === currentSong.videoId ? 'text-primary' : 'text-on-surface'
                  }`}>{song.title}</p>
                  <p className="text-xs text-on-surface-variant truncate mt-0.5">
                    {song.channelTitle}
                  </p>
                </div>
                {song.videoId === currentSong.videoId && (
                  <span className="material-symbols-outlined text-primary text-sm flex-shrink-0">
                    equalizer
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
