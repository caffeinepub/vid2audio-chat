/**
 * Restricted video source detection utilities.
 * Identifies platforms like YouTube and TikTok that typically block direct browser access.
 */

export type RestrictedSource = 'youtube' | 'tiktok' | null;

/**
 * Detects if a URL belongs to a restricted video source (YouTube, TikTok, etc.)
 * @param url - The URL to check
 * @returns The restricted source type or null if not restricted
 */
export function detectRestrictedSource(url: string): RestrictedSource {
  if (!url) return null;

  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    const hostname = urlObj.hostname.toLowerCase();

    // YouTube detection
    if (
      hostname === 'youtube.com' ||
      hostname === 'www.youtube.com' ||
      hostname === 'youtu.be' ||
      hostname === 'm.youtube.com'
    ) {
      return 'youtube';
    }

    // TikTok detection
    if (
      hostname === 'tiktok.com' ||
      hostname === 'www.tiktok.com' ||
      hostname === 'vm.tiktok.com' ||
      hostname === 'm.tiktok.com'
    ) {
      return 'tiktok';
    }

    return null;
  } catch {
    // If URL parsing fails, do a simple string check
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      return 'youtube';
    }
    if (lowerUrl.includes('tiktok.com')) {
      return 'tiktok';
    }
    return null;
  }
}

/**
 * Gets a user-friendly error message for a restricted source
 * @param source - The restricted source type
 * @returns A tailored error message with guidance
 */
export function getRestrictedSourceError(source: RestrictedSource): string {
  switch (source) {
    case 'youtube':
      return 'YouTube videos cannot be accessed directly from the browser due to CORS restrictions and anti-bot protection. Please download the video using a YouTube downloader and upload the file directly.';
    case 'tiktok':
      return 'TikTok videos cannot be accessed directly from the browser due to CORS restrictions and anti-bot protection. Please download the video and upload the file directly.';
    default:
      return 'This video source cannot be accessed directly from the browser. Please download the video and upload the file directly.';
  }
}

/**
 * Gets a user-friendly warning message for a restricted source (for inline warnings)
 * @param source - The restricted source type
 * @returns A short warning message
 */
export function getRestrictedSourceWarning(source: RestrictedSource): string {
  switch (source) {
    case 'youtube':
      return 'YouTube videos cannot be accessed directly from the browser due to restrictions. Please download the video using a YouTube downloader and upload the file directly.';
    case 'tiktok':
      return 'TikTok videos cannot be accessed directly from the browser due to restrictions. Please download the video and upload the file directly.';
    default:
      return 'This video source may not be accessible directly from the browser. Please download the video and upload the file directly.';
  }
}
