// YouTube Data API v3 types for music streaming

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  thumbnailHigh: string;
  description: string;
}

export interface YouTubeSearchResult {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
  };
}

export interface YouTubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeSearchResult[];
}

// Types for the /videos endpoint (used by getTrendingMusic)
export interface YouTubeVideoResult {
  kind: string;
  etag: string;
  id: string; // Direct video ID string, not an object
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
  };
}

export interface YouTubeVideoResponse {
  kind: string;
  etag: string;
  nextPageToken: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YouTubeVideoResult[];
}

export interface PlaylistSong {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  addedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  songs: PlaylistSong[];
  createdAt: number;
}

// Convert YouTube search API result to our internal format
export function mapYouTubeVideo(result: YouTubeSearchResult): YouTubeVideo {
  return {
    videoId: result.id.videoId,
    title: result.snippet.title,
    channelTitle: result.snippet.channelTitle,
    thumbnail: result.snippet.thumbnails.default.url,
    thumbnailHigh: result.snippet.thumbnails.high?.url || result.snippet.thumbnails.medium.url,
    description: result.snippet.description,
  };
}

// Convert YouTube video API result to our internal format (for /videos endpoint)
export function mapYouTubeVideoResult(result: YouTubeVideoResult): YouTubeVideo {
  return {
    videoId: result.id,
    title: result.snippet.title,
    channelTitle: result.snippet.channelTitle,
    thumbnail: result.snippet.thumbnails.default.url,
    thumbnailHigh: result.snippet.thumbnails.high?.url || result.snippet.thumbnails.medium.url,
    description: result.snippet.description,
  };
}
