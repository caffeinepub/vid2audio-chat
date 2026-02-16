import { useMutation } from '@tanstack/react-query';
import { convertVideoToAudio } from './convertVideoToAudio';

interface ConversionParams {
  file: File;
  format: 'mp3' | 'wav';
  onProgress?: (progress: number) => void;
}

interface ConversionResult {
  url: string;
  filename: string;
}

export function useConversionMutation() {
  return useMutation<ConversionResult, Error, ConversionParams>({
    mutationFn: async ({ file, format, onProgress }) => {
      const result = await convertVideoToAudio(file, format, onProgress);
      return result;
    },
  });
}
