/// <reference types="vite/client" />

declare global {
  interface Window {
    lamejs?: {
      Mp3Encoder: new (channels: number, sampleRate: number, kbps: number) => {
        encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
        flush(): Int8Array;
      };
    };
  }
}

// Load lamejs dynamically
let lameLoaded = false;
async function loadLame(): Promise<void> {
  if (lameLoaded && window.lamejs) return;
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/vendor/lame.min.js';
    script.onload = () => {
      lameLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load MP3 encoder library. Please refresh the page and try again.'));
    document.head.appendChild(script);
  });
}

function encodeWAV(audioBuffer: AudioBuffer): Blob {
  const numberOfChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length * numberOfChannels * 2;

  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM format
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i];
      const int16 = Math.max(-1, Math.min(1, sample)) * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

async function encodeMp3(audioBuffer: AudioBuffer, onProgress?: (progress: number) => void): Promise<Blob> {
  let audioContext: AudioContext | null = null;
  
  try {
    await loadLame();

    if (!window.lamejs) {
      throw new Error('MP3 encoder library is not available. Please refresh the page and try again.');
    }

    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;

    // Validate audio buffer properties
    if (!channels || channels < 1 || channels > 2) {
      throw new Error('Audio must have 1 or 2 channels. This video format may not be supported.');
    }

    if (!sampleRate || sampleRate < 8000 || sampleRate > 48000) {
      throw new Error('Audio sample rate must be between 8kHz and 48kHz. This video format may not be supported.');
    }

    if (!audioBuffer.length || audioBuffer.length === 0) {
      throw new Error('Audio buffer is empty. The video may not contain audio or the format is not supported.');
    }

    // Initialize MP3 encoder with error handling
    let mp3encoder;
    try {
      mp3encoder = new window.lamejs.Mp3Encoder(channels, sampleRate, 128);
    } catch (error) {
      console.error('MP3 encoder initialization error:', error);
      throw new Error('Failed to initialize MP3 encoder. The audio format may not be compatible.');
    }

    const mp3Data: Int8Array[] = [];
    const sampleBlockSize = 1152;

    // Convert float samples to int16 with validation
    const leftChannel = audioBuffer.getChannelData(0);
    if (!leftChannel || leftChannel.length === 0) {
      throw new Error('Audio data is invalid or empty. The video may not contain audio.');
    }

    const rightChannel = channels > 1 ? audioBuffer.getChannelData(1) : null;

    const leftInt16 = new Int16Array(leftChannel.length);
    const rightInt16 = rightChannel ? new Int16Array(rightChannel.length) : null;

    // Convert samples with bounds checking
    for (let i = 0; i < leftChannel.length; i++) {
      const leftSample = leftChannel[i];
      if (isNaN(leftSample) || !isFinite(leftSample)) {
        leftInt16[i] = 0;
      } else {
        leftInt16[i] = Math.max(-1, Math.min(1, leftSample)) * 0x7fff;
      }
      
      if (rightInt16 && rightChannel) {
        const rightSample = rightChannel[i];
        if (isNaN(rightSample) || !isFinite(rightSample)) {
          rightInt16[i] = 0;
        } else {
          rightInt16[i] = Math.max(-1, Math.min(1, rightSample)) * 0x7fff;
        }
      }
    }

    // Encode in blocks with error handling
    const totalBlocks = Math.ceil(leftInt16.length / sampleBlockSize);
    for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
      try {
        const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
        const rightChunk = rightInt16 ? rightInt16.subarray(i, i + sampleBlockSize) : undefined;

        // Validate chunks before encoding
        if (!leftChunk || leftChunk.length === 0) {
          continue;
        }

        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf && mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }

        if (onProgress) {
          const progress = 50 + ((i / leftInt16.length) * 50);
          onProgress(Math.min(99, progress));
        }
      } catch (error) {
        console.error('MP3 encoding block error:', error);
        throw new Error('MP3 encoding failed. The audio format may not be compatible with MP3 conversion.');
      }
    }

    // Flush remaining data with error handling
    try {
      const mp3buf = mp3encoder.flush();
      if (mp3buf && mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
    } catch (error) {
      console.error('MP3 encoder flush error:', error);
      // Continue anyway - we may have partial data
    }

    if (mp3Data.length === 0) {
      throw new Error('MP3 encoding produced no output. The audio format may not be compatible.');
    }

    // Convert Int8Array chunks to a single buffer for Blob
    const totalLength = mp3Data.reduce((acc, arr) => acc + arr.length, 0);
    if (totalLength === 0) {
      throw new Error('MP3 encoding produced empty output. The audio format may not be compatible.');
    }

    const combinedBuffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of mp3Data) {
      try {
        combinedBuffer.set(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength), offset);
        offset += chunk.length;
      } catch (error) {
        console.error('Buffer copy error:', error);
        throw new Error('Failed to process MP3 data. Please try converting to WAV format instead.');
      }
    }
    
    return new Blob([combinedBuffer.buffer], { type: 'audio/mp3' });
  } catch (error) {
    // Ensure we always throw a user-friendly error
    if (error instanceof Error) {
      // If it's already a user-friendly error, re-throw it
      if (error.message.includes('encoder') || 
          error.message.includes('format') || 
          error.message.includes('compatible') ||
          error.message.includes('audio') ||
          error.message.includes('WAV')) {
        throw error;
      }
    }
    // For any other errors, provide a generic user-friendly message
    console.error('Unexpected MP3 encoding error:', error);
    throw new Error('MP3 conversion failed. Please try converting to WAV format instead, or use a different video file.');
  } finally {
    // Clean up audio context if created
    if (audioContext) {
      try {
        await audioContext.close();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

export async function convertVideoToAudio(
  file: File,
  format: 'mp3' | 'wav',
  onProgress?: (progress: number) => void
): Promise<{ url: string; filename: string }> {
  let videoUrl: string | null = null;
  let audioContext: AudioContext | null = null;
  let blobUrl: string | null = null;

  try {
    if (onProgress) onProgress(10);

    // Validate file
    if (!file || file.size === 0) {
      throw new Error('The video file is empty or invalid. Please select a valid video file.');
    }

    // Create video element to validate it's a video
    videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;

    // Wait for video to load with timeout
    await Promise.race([
      new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video file. The file may be corrupted or in an unsupported format.'));
      }),
      new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('Video loading timed out. The file may be too large or in an unsupported format.')), 30000)
      )
    ]);

    if (onProgress) onProgress(20);

    // Create audio context
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      throw new Error('Failed to initialize audio processor. Your browser may not support this feature.');
    }
    
    // Read file as array buffer
    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await file.arrayBuffer();
    } catch (error) {
      throw new Error('Failed to read video file. The file may be too large or corrupted.');
    }
    
    if (onProgress) onProgress(30);

    // Decode audio data with error handling
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (error) {
      console.error('Audio decode error:', error);
      throw new Error('Failed to extract audio from video. The video may not contain audio or uses an unsupported codec.');
    }

    // Validate decoded audio
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('No audio found in the video file. Please select a video that contains audio.');
    }

    if (onProgress) onProgress(50);

    // Encode to target format
    let blob: Blob;
    try {
      if (format === 'wav') {
        blob = encodeWAV(audioBuffer);
        if (onProgress) onProgress(90);
      } else {
        blob = await encodeMp3(audioBuffer, onProgress);
      }
    } catch (error) {
      // Re-throw encoding errors (already user-friendly)
      throw error;
    }

    if (!blob || blob.size === 0) {
      throw new Error(`Failed to create ${format.toUpperCase()} file. Please try again or use a different format.`);
    }

    if (onProgress) onProgress(100);

    // Create download URL
    blobUrl = URL.createObjectURL(blob);
    const filename = file.name.replace(/\.[^/.]+$/, '') + '.' + format;

    return { url: blobUrl, filename };
  } catch (error) {
    // Clean up on error
    if (blobUrl) {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    console.error('Conversion error:', error);
    
    // Ensure we always throw a user-friendly error message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred during conversion. Please try again.');
  } finally {
    // Clean up resources
    if (videoUrl) {
      try {
        URL.revokeObjectURL(videoUrl);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    if (audioContext) {
      try {
        await audioContext.close();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}
