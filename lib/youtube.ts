// YouTube Data API v3 utilities

import { YouTubeSearchResponse, YouTubeVideoResponse } from "./types";

// Direct API key fallback if .env.local doesn't load
const API_KEY = process.env.YOUTUBE_API_KEY || "AIzaSyCInw8KQtwd0yLkjuWBYN5qSBN9RWcpCAY";
const BASE_URL = "https://www.googleapis.com/youtube/v3";

// Cache configuration
const CACHE_TTL = {
  trending: 30 * 60 * 1000, // 30 minutes
  search: 60 * 60 * 1000,   // 1 hour
  videoDetails: 24 * 60 * 60 * 1000, // 24 hours
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache (resets on page reload)
const memoryCache = new Map<string, CacheEntry<any>>();

/**
 * Check if we're hitting quota errors
 */
function isQuotaError(error: any): boolean {
  return error?.message?.includes('quota') || 
         error?.message?.includes('quotaExceeded') ||
         error?.error?.code === 403;
}

/**
 * Generic cache getter/setter
 */
function getCached<T>(key: string, ttl: number): T | null {
  // Check memory cache first
  const memEntry = memoryCache.get(key);
  if (memEntry && Date.now() - memEntry.timestamp < ttl) {
    return memEntry.data;
  }

  // Check localStorage (client-side only)
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`yt_cache_${key}`);
      if (cached) {
        const entry: CacheEntry<T> = JSON.parse(cached);
        if (Date.now() - entry.timestamp < ttl) {
          // Refresh memory cache
          memoryCache.set(key, entry);
          return entry.data;
        } else {
          // Expired, remove it
          localStorage.removeItem(`yt_cache_${key}`);
          memoryCache.delete(key);
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  return null;
}

function setCached<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };

  // Update memory cache
  memoryCache.set(key, entry);

  // Update localStorage (client-side only)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`yt_cache_${key}`, JSON.stringify(entry));
    } catch (e) {
      // Ignore localStorage errors (e.g., quota exceeded)
    }
  }
}

/**
 * Check YouTube API quota status (approximate)
 * Returns estimated remaining quota units
 */
export function getQuotaStatus(): { remaining: number; resetTime: Date } {
  if (typeof window === 'undefined') {
    return { remaining: 10000, resetTime: new Date() };
  }

  // Track API calls in localStorage
  try {
    const status = localStorage.getItem('yt_quota_status');
    if (status) {
      const { used, resetTime } = JSON.parse(status);
      const reset = new Date(resetTime);
      
      // Reset counter if it's past reset time
      if (Date.now() > reset.getTime()) {
        return { remaining: 10000, resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000) };
      }
      
      return { remaining: Math.max(0, 10000 - used), resetTime: reset };
    }
  } catch (e) {
    // Ignore errors
  }

  return { remaining: 10000, resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000) };
}

function trackApiCall(units: number): void {
  if (typeof window === 'undefined') return;

  try {
    const status = localStorage.getItem('yt_quota_status');
    let used = 0;
    let resetTime = Date.now() + 24 * 60 * 60 * 1000;

    if (status) {
      const parsed = JSON.parse(status);
      const resetDate = new Date(parsed.resetTime);
      
      if (Date.now() > resetDate.getTime()) {
        // Reset counter
        used = units;
        resetTime = Date.now() + 24 * 60 * 60 * 1000;
      } else {
        used = parsed.used + units;
        resetTime = resetDate.getTime();
      }
    } else {
      used = units;
    }

    localStorage.setItem('yt_quota_status', JSON.stringify({
      used,
      resetTime: new Date(resetTime).toISOString(),
    }));
  } catch (e) {
    // Ignore errors
  }
}

/**
 * Search for music videos on YouTube
 * Uses the YouTube Data API v3 search endpoint
 */
export async function searchMusic(
  query: string,
  maxResults: number = 20,
  pageToken?: string
): Promise<YouTubeSearchResponse> {
  // Check cache first (only for first page)
  const cacheKey = `search_${query}_${maxResults}`;
  if (!pageToken) {
    const cached = getCached<YouTubeSearchResponse>(cacheKey, CACHE_TTL.search);
    if (cached) {
      return cached;
    }
  }

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
    const apiError = error.error?.message || "Failed to search YouTube";
    
    // Track if it's a quota error
    if (isQuotaError(error)) {
      console.warn('YouTube API quota exceeded:', apiError);
      throw new Error(`QUOTA_EXCEEDED: ${apiError}`);
    }
    
    throw new Error(apiError);
  }

  const data = await response.json();

  // Cache the result (only for first page)
  if (!pageToken) {
    setCached(cacheKey, data);
    trackApiCall(100); // Search costs 100 units
  }

  return data;
}

/**
 * Get trending music videos
 * Uses the /videos endpoint with mostPopular chart
 */
export async function getTrendingMusic(
  maxResults: number = 20,
  regionCode: string = "US"
): Promise<YouTubeVideoResponse> {
  // Check cache first
  const cacheKey = `trending_${regionCode}_${maxResults}`;
  const cached = getCached<YouTubeVideoResponse>(cacheKey, CACHE_TTL.trending);
  if (cached) {
    return cached;
  }

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
    const apiError = error.error?.message || "Failed to fetch trending music";
    
    if (isQuotaError(error)) {
      console.warn('YouTube API quota exceeded:', apiError);
      throw new Error(`QUOTA_EXCEEDED: ${apiError}`);
    }
    
    throw new Error(apiError);
  }

  const data = await response.json();

  // Cache the result
  setCached(cacheKey, data);
  trackApiCall(1); // Videos endpoint costs 1 unit per video

  return data;
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
  // Check cache first
  const cacheKey = `video_${videoId}`;
  const cached = getCached<any>(cacheKey, CACHE_TTL.videoDetails);
  if (cached) {
    return cached;
  }

  const params = new URLSearchParams({
    part: "snippet",
    id: videoId,
    key: API_KEY!,
  });

  const response = await fetch(`${BASE_URL}/videos?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json();
    const apiError = error.error?.message || "Failed to fetch video details";
    
    if (isQuotaError(error)) {
      console.warn('YouTube API quota exceeded:', apiError);
      throw new Error(`QUOTA_EXCEEDED: ${apiError}`);
    }
    
    throw new Error(apiError);
  }

  const data = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error("Video not found");
  }

  const item = data.items[0];
  const result = {
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    description: item.snippet.description,
    thumbnails: item.snippet.thumbnails,
  };

  // Cache the result
  setCached(cacheKey, result);
  trackApiCall(1);

  return result;
}

/**
 * Clear all YouTube API caches
 */
export function clearCache(): void {
  memoryCache.clear();
  
  if (typeof window !== 'undefined') {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('yt_cache_'));
      keys.forEach(key => localStorage.removeItem(key));
      localStorage.removeItem('yt_quota_status');
    } catch (e) {
      // Ignore errors
    }
  }
}
