export function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  
  // If URL doesn't start with http:// or https://, try adding https://
  if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return 'https://' + trimmed;
  }
  
  return trimmed;
}
