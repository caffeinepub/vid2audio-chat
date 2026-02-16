/**
 * Validates whether a Blob is likely a playable video by attempting to load it
 * in a temporary video element. This is useful when Content-Type headers are
 * missing or unreliable.
 */
export async function isVideoBlob(blob: Blob): Promise<boolean> {
  return new Promise((resolve) => {
    // Quick check: if blob is very small, it's probably not a video
    if (blob.size < 1024) {
      resolve(false);
      return;
    }

    // Check common video file signatures (magic numbers)
    const reader = new FileReader();
    reader.onload = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer);
      
      // Check for common video file signatures
      const signatures = [
        // MP4, M4V, MOV (ftyp)
        [0x00, 0x00, 0x00, null, 0x66, 0x74, 0x79, 0x70],
        // AVI (RIFF....AVI)
        [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x41, 0x56, 0x49],
        // WebM (EBML)
        [0x1A, 0x45, 0xDF, 0xA3],
        // FLV
        [0x46, 0x4C, 0x56],
        // MKV (EBML)
        [0x1A, 0x45, 0xDF, 0xA3],
        // MPEG
        [0x00, 0x00, 0x01, 0xBA],
        [0x00, 0x00, 0x01, 0xB3],
      ];

      for (const sig of signatures) {
        let match = true;
        for (let i = 0; i < sig.length && i < arr.length; i++) {
          if (sig[i] !== null && arr[i] !== sig[i]) {
            match = false;
            break;
          }
        }
        if (match) {
          resolve(true);
          return;
        }
      }

      // If no signature match, try to load it as video
      tryLoadAsVideo(blob, resolve);
    };

    reader.onerror = () => {
      resolve(false);
    };

    // Read first 32 bytes for signature check
    reader.readAsArrayBuffer(blob.slice(0, 32));
  });
}

function tryLoadAsVideo(blob: Blob, resolve: (value: boolean) => void): void {
  const video = document.createElement('video');
  const url = URL.createObjectURL(blob);
  
  let resolved = false;
  const cleanup = () => {
    if (!resolved) {
      resolved = true;
      URL.revokeObjectURL(url);
      video.remove();
    }
  };

  const timeout = setTimeout(() => {
    cleanup();
    resolve(false);
  }, 5000);

  video.onloadedmetadata = () => {
    clearTimeout(timeout);
    cleanup();
    // Check if video has valid dimensions and duration
    const isValid = video.videoWidth > 0 && video.videoHeight > 0 && video.duration > 0;
    resolve(isValid);
  };

  video.onerror = () => {
    clearTimeout(timeout);
    cleanup();
    resolve(false);
  };

  video.src = url;
  video.load();
}
