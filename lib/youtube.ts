// YouTube Data API v3 utilities

import { YouTubeSearchResponse, YouTubeVideoResponse } from "./types";

// Direct API key fallback if .env.local doesn't load
const API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyCIHvNroTcVBjr5CrB3VA6UvH6NR2NiU4k";
const BASE_URL = "https://www.googleapis.com/youtube/v3";

/**
 * Search for music videos on YouTube
 * Uses the YouTube Data API v3 search endpoint
 */
export async function searchMusic(
  query: string,
  maxResults: number = 20,
  pageToken?: string
): Promise<YouTubeSearchResponse> {
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    videoCategoryId: "10", // Music category
    maxResults: maxResults.toString(),
    key: API_KEY!,
    relevanceLanguage: "en",
    safeSearch: "moderate",
  });

  if (pageToken) {
    params.append("pageToken", pageToken);
  }

  const response = await fetch(`${BASE_URL}/search?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to search YouTube");
  }

  return response.json();
}

/**
 * Get trending music videos
 * Uses the /videos endpoint with mostPopular chart
 */
export async function getTrendingMusic(
  maxResults: number = 20,
  regionCode: string = "US"
): Promise<YouTubeVideoResponse> {
  const params = new URLSearchParams({
    part: "snippet",
    chart: "mostPopular",
    videoCategoryId: "10", // Music category
    maxResults: maxResults.toString(),
    key: API_KEY!,
    regionCode,
  });

  const response = await fetch(`${BASE_URL}/videos?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch trending music");
  }

  return response.json();
}

/**
 * Get video details (for getting full info when playing)
 */
export async function getVideoDetails(
  videoId: string
): Promise<{
  title: string;
  channelTitle: string;
  description: string;
  thumbnails: Record<string, { url: string }>;
}> {
  const params = new URLSearchParams({
    part: "snippet",
    id: videoId,
    key: API_KEY!,
  });

  const response = await fetch(`${BASE_URL}/videos?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch video details");
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error("Video not found");
  }

  const item = data.items[0];
  return {
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    description: item.snippet.description,
    thumbnails: item.snippet.thumbnails,
  };
}
