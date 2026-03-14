/**
 * Video URL utilities
 * Handles conversion of YouTube URLs to embed URLs and thumbnails
 * Also supports Goojara, Moviebox, and Netflix URLs
 */

// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
];

// Goojara URL patterns
const GOOJARA_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?goojara\.to\/watch\/([a-zA-Z0-9_-]+)/,
  /(?:https?:\/\/)?(?:www\.)?goojara\.ch\/watch\/([a-zA-Z0-9_-]+)/,
  /(?:https?:\/\/)?(?:www\.)?goojara\.ws\/watch\/([a-zA-Z0-9_-]+)/,
];

// Moviebox URL patterns
const MOVIEBOX_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?moviebox\.ng\/watch\/([a-zA-Z0-9_-]+)/,
  /(?:https?:\/\/)?(?:www\.)?moviebox\.pro\/watch\/([a-zA-Z0-9_-]+)/,
];

// Netflix URL patterns
const NETFLIX_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?netflix\.com\/watch\/([0-9]+)/,
  /(?:https?:\/\/)?(?:www\.)?netflix\.com\/title\/([0-9]+)/,
];

// Video site type constants
export const VIDEO_SITE = {
  YOUTUBE: 'youtube',
  GOOJARA: 'goojara',
  MOVIEBOX: 'moviebox',
  NETFLIX: 'netflix',
  OTHER: 'other'
};

/**
 * Check if a URL is a YouTube URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's a YouTube URL
 */
export const isYouTubeUrl = (url) => {
  if (!url) return false;
  return YOUTUBE_PATTERNS.some((pattern) => pattern.test(url));
};

/**
 * Check if a URL is from a supported streaming site
 * @param {string} url - The URL to check
 * @returns {string} - The streaming site type
 */
export const getVideoSiteType = (url) => {
  if (!url) return VIDEO_SITE.OTHER;
  
  if (YOUTUBE_PATTERNS.some((pattern) => pattern.test(url))) {
    return VIDEO_SITE.YOUTUBE;
  }
  if (GOOJARA_PATTERNS.some((pattern) => pattern.test(url))) {
    return VIDEO_SITE.GOOJARA;
  }
  if (MOVIEBOX_PATTERNS.some((pattern) => pattern.test(url))) {
    return VIDEO_SITE.MOVIEBOX;
  }
  if (NETFLIX_PATTERNS.some((pattern) => pattern.test(url))) {
    return VIDEO_SITE.NETFLIX;
  }
  
  return VIDEO_SITE.OTHER;
};

/**
 * Check if URL is from any supported streaming site
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's a supported streaming site URL
 */
export const isStreamingSiteUrl = (url) => {
  return getVideoSiteType(url) !== VIDEO_SITE.OTHER;
};

/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if not found
 */
export const getYouTubeVideoId = (url) => {
  if (!url) return null;
  
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

/**
 * Get YouTube embed URL from any YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Embed URL or null if not valid YouTube URL
 */
export const getYouTubeEmbedUrl = (url) => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube.com/embed/${videoId}`;
};

/**
 * Get YouTube thumbnail URL
 * @param {string} url - YouTube URL
 * @param {string} quality - Thumbnail quality: 'default', 'medium', 'high', 'maxres'
 * @returns {string|null} - Thumbnail URL or null if not valid YouTube URL
 */
export const getYouTubeThumbnail = (url, quality = 'high') => {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault',
  };
  
  const qualitySuffix = qualityMap[quality] || 'hqdefault';
  return `https://img.youtube.com/vi/${videoId}/${qualitySuffix}.jpg`;
};

/**
 * Get Goojara embed URL
 * @param {string} url - Goojara URL
 * @returns {string|null} - Embed URL or null if not valid
 */
export const getGoojaraEmbedUrl = (url) => {
  if (!url) return null;
  for (const pattern of GOOJARA_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Goojara uses iframe embed - return the watch page URL
      return url;
    }
  }
  return null;
};

/**
 * Get Moviebox embed URL
 * @param {string} url - Moviebox URL
 * @returns {string|null} - Embed URL or null if not valid
 */
export const getMovieboxEmbedUrl = (url) => {
  if (!url) return null;
  for (const pattern of MOVIEBOX_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return url;
    }
  }
  return null;
};

/**
 * Get Netflix embed URL
 * @param {string} url - Netflix URL
 * @returns {string|null} - Embed URL or null if not valid
 */
export const getNetflixEmbedUrl = (url) => {
  if (!url) return null;
  for (const pattern of NETFLIX_PATTERNS) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Netflix doesn't allow embedding, return the watch URL
      return url;
    }
  }
  return null;
};

/**
 * Get embed URL for any supported streaming site
 * @param {string} url - Streaming site URL
 * @returns {string|null} - Embed URL or null if not supported
 */
export const getEmbedUrl = (url) => {
  const siteType = getVideoSiteType(url);
  
  switch (siteType) {
    case VIDEO_SITE.YOUTUBE:
      return getYouTubeEmbedUrl(url);
    case VIDEO_SITE.GOOJARA:
      return getGoojaraEmbedUrl(url);
    case VIDEO_SITE.MOVIEBOX:
      return getMovieboxEmbedUrl(url);
    case VIDEO_SITE.NETFLIX:
      return getNetflixEmbedUrl(url);
    default:
      return null;
  }
};

// Default export for backwards compatibility
const youtubeUtils = {
  isYouTubeUrl,
  getYouTubeVideoId,
  getYouTubeEmbedUrl,
  getYouTubeThumbnail,
  getVideoSiteType,
  isStreamingSiteUrl,
  getEmbedUrl,
  VIDEO_SITE,
};

export default youtubeUtils;
