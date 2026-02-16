export type ConversionStatus = 'pending' | 'fetching' | 'converting' | 'done' | 'failed';

export interface ConversionJob {
  id: string;
  inputType: 'link' | 'upload';
  sourceLabel: string;
  format: 'mp3' | 'wav';
  status: ConversionStatus;
  timestamp: number;
  progress?: number;
  downloadUrl?: string;
  filename?: string;
  error?: string;
}
