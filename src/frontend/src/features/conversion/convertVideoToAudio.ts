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
    script.onerror = () => reject(new Error('Failed to load MP3 encoder'));
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
  await loadLame();

  if (!window.lamejs) {
    throw new Error('MP3 encoder not available');
  }

  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const mp3encoder = new window.lamejs.Mp3Encoder(channels, sampleRate, 128);

  const mp3Data: Int8Array[] = [];
  const sampleBlockSize = 1152;

  // Convert float samples to int16
  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = channels > 1 ? audioBuffer.getChannelData(1) : null;

  const leftInt16 = new Int16Array(leftChannel.length);
  const rightInt16 = rightChannel ? new Int16Array(rightChannel.length) : null;

  for (let i = 0; i < leftChannel.length; i++) {
    leftInt16[i] = Math.max(-1, Math.min(1, leftChannel[i])) * 0x7fff;
    if (rightInt16 && rightChannel) {
      rightInt16[i] = Math.max(-1, Math.min(1, rightChannel[i])) * 0x7fff;
    }
  }

  // Encode in blocks
  const totalBlocks = Math.ceil(leftInt16.length / sampleBlockSize);
  for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
    const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
    const rightChunk = rightInt16 ? rightInt16.subarray(i, i + sampleBlockSize) : undefined;

    const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }

    if (onProgress) {
      const progress = 50 + ((i / leftInt16.length) * 50);
      onProgress(progress);
    }
  }

  // Flush remaining data
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(mp3buf);
  }

  // Convert Int8Array chunks to a single buffer for Blob
  const totalLength = mp3Data.reduce((acc, arr) => acc + arr.length, 0);
  const combinedBuffer = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of mp3Data) {
    combinedBuffer.set(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength), offset);
    offset += chunk.length;
  }
  
  return new Blob([combinedBuffer.buffer], { type: 'audio/mp3' });
}

export async function convertVideoToAudio(
  file: File,
  format: 'mp3' | 'wav',
  onProgress?: (progress: number) => void
): Promise<{ url: string; filename: string }> {
  try {
    if (onProgress) onProgress(10);

    // Create video element to extract audio
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;

    // Wait for video to load
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Failed to load video file'));
    });

    if (onProgress) onProgress(20);

    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    if (onProgress) onProgress(30);

    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    if (onProgress) onProgress(50);

    // Encode to target format
    let blob: Blob;
    if (format === 'wav') {
      blob = encodeWAV(audioBuffer);
      if (onProgress) onProgress(90);
    } else {
      blob = await encodeMp3(audioBuffer, onProgress);
    }

    if (onProgress) onProgress(100);

    // Clean up
    URL.revokeObjectURL(videoUrl);

    // Create download URL
    const url = URL.createObjectURL(blob);
    const filename = file.name.replace(/\.[^/.]+$/, '') + '.' + format;

    return { url, filename };
  } catch (error) {
    console.error('Conversion error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to convert video to audio'
    );
  }
}
