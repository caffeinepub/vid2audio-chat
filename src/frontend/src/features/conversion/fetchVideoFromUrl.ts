import { isValidUrl, normalizeUrl } from '../validation/urlValidation';
import { isVideoBlob } from './videoValidation';
import { detectRestrictedSource, getRestrictedSourceError } from './restrictedSources';

export async function fetchVideoFromUrl(url: string): Promise<File> {
  const normalizedUrl = normalizeUrl(url);
  
  if (!isValidUrl(normalizedUrl)) {
    throw new Error('Invalid URL format. Please enter a valid http:// or https:// URL.');
  }

  // Check if this is a restricted source (YouTube, TikTok, etc.)
  const restrictedSource = detectRestrictedSource(normalizedUrl);
  if (restrictedSource) {
    throw new Error(getRestrictedSourceError(restrictedSource));
  }

  let finalUrl = normalizedUrl;
  let response: Response;

  try {
    // First attempt: direct fetch with CORS
    response = await fetch(normalizedUrl, {
      mode: 'cors',
      redirect: 'follow',
    });

    // If we got redirected, update the final URL and check if it's restricted
    if (response.url && response.url !== normalizedUrl) {
      finalUrl = response.url;
      const redirectedSource = detectRestrictedSource(finalUrl);
      if (redirectedSource) {
        throw new Error(getRestrictedSourceError(redirectedSource));
      }
    }

    if (!response.ok) {
      if (response.status === 403 || response.status === 401) {
        throw new Error('Access denied. The video source requires authentication or blocks direct access. Please download the video and upload it directly.');
      } else if (response.status === 404) {
        throw new Error('Video not found. The URL may be incorrect or the video may have been removed.');
      } else {
        throw new Error(`Failed to fetch video (HTTP ${response.status}). The video may not be publicly accessible.`);
      }
    }

    const contentType = response.headers.get('content-type');
    const blob = await response.blob();

    // Check if content-type indicates video
    const hasVideoContentType = contentType && contentType.startsWith('video/');
    
    // If content-type is missing or generic, try to validate the blob
    if (!hasVideoContentType) {
      const isVideo = await isVideoBlob(blob);
      if (!isVideo) {
        throw new Error('The URL does not point to a video file. Please provide a direct link to a video file or upload the video directly.');
      }
    }

    // Extract filename from URL or use default
    let filename = 'video.mp4';
    try {
      const urlPath = new URL(finalUrl).pathname;
      const pathParts = urlPath.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.includes('.')) {
        filename = lastPart;
      } else if (blob.type) {
        // Use blob type to determine extension
        const ext = blob.type.split('/')[1] || 'mp4';
        filename = `video.${ext}`;
      }
    } catch {
      // Use default filename with blob type if available
      if (blob.type && blob.type.startsWith('video/')) {
        const ext = blob.type.split('/')[1] || 'mp4';
        filename = `video.${ext}`;
      }
    }

    return new File([blob], filename, { type: blob.type || 'video/mp4' });
  } catch (error) {
    if (error instanceof TypeError) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        // Check if the original URL was a restricted source
        const sourceType = detectRestrictedSource(normalizedUrl);
        if (sourceType) {
          throw new Error(getRestrictedSourceError(sourceType));
        }
        
        throw new Error(
          'Unable to access the video. The source may block browser access (CORS), require authentication, or use anti-bot protection. Please try: (1) providing a direct video file URL, or (2) downloading and uploading the video file directly.'
        );
      }
    }
    
    // Re-throw if it's already a user-friendly error
    if (error instanceof Error && (
      error.message.includes('Invalid URL') ||
      error.message.includes('Access denied') ||
      error.message.includes('not found') ||
      error.message.includes('does not point to') ||
      error.message.includes('Unable to access') ||
      error.message.includes('cannot be accessed')
    )) {
      throw error;
    }

    // Generic error
    console.error('Video fetch error:', error);
    throw new Error(
      'Failed to fetch video from URL. The link may not be accessible, may require authentication, or may not be a direct video link. Please try uploading the video file directly.'
    );
  }
}
