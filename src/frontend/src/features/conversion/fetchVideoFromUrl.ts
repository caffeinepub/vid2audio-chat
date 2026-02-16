import { isValidUrl } from '../validation/urlValidation';

export async function fetchVideoFromUrl(url: string): Promise<File> {
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL provided');
  }

  try {
    const response = await fetch(url, {
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('video/')) {
      throw new Error('The URL does not point to a video file');
    }

    const blob = await response.blob();
    
    // Extract filename from URL or use default
    let filename = 'video';
    try {
      const urlPath = new URL(url).pathname;
      const pathParts = urlPath.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.includes('.')) {
        filename = lastPart;
      }
    } catch {
      // Use default filename
    }

    return new File([blob], filename, { type: blob.type });
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(
        'Unable to access the video URL. This may be due to CORS restrictions, authentication requirements, or the link being inaccessible. Please try uploading the video file directly instead.'
      );
    }
    throw error;
  }
}
