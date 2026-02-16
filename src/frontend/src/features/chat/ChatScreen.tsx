import { useState } from 'react';
import ChatThread from './components/ChatThread';
import ChatComposer from './components/ChatComposer';
import { useJobHistory } from '../jobs/useJobHistory';
import { useConversionMutation } from '../conversion/useConversionMutation';
import { fetchVideoFromUrl } from '../conversion/fetchVideoFromUrl';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ChatScreen() {
  const { jobs, addJob, updateJob } = useJobHistory();
  const [isProcessing, setIsProcessing] = useState(false);
  const conversionMutation = useConversionMutation();

  const handleConvert = async (
    inputType: 'link' | 'upload',
    source: string | File,
    format: 'mp3' | 'wav'
  ) => {
    setIsProcessing(true);
    
    // Create job entry
    const jobId = addJob({
      inputType,
      sourceLabel: typeof source === 'string' ? source : source.name,
      format,
      status: 'pending',
    });

    try {
      let fileToConvert: File;

      if (inputType === 'link' && typeof source === 'string') {
        // Update status to fetching
        updateJob(jobId, { status: 'fetching' });
        
        try {
          fileToConvert = await fetchVideoFromUrl(source);
        } catch (error) {
          updateJob(jobId, {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Failed to fetch video from URL. The link may not be accessible due to CORS restrictions or authentication requirements. Please try uploading the file directly instead.',
          });
          setIsProcessing(false);
          return;
        }
      } else if (source instanceof File) {
        fileToConvert = source;
      } else {
        throw new Error('Invalid source type');
      }

      // Update status to converting
      updateJob(jobId, { status: 'converting' });

      // Perform conversion
      const result = await conversionMutation.mutateAsync({
        file: fileToConvert,
        format,
        onProgress: (progress) => {
          updateJob(jobId, { progress });
        },
      });

      // Update job with success
      updateJob(jobId, {
        status: 'done',
        downloadUrl: result.url,
        filename: result.filename,
        progress: 100,
      });
    } catch (error) {
      updateJob(jobId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Conversion failed. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Vid2Audio Chat</h1>
              <p className="text-sm text-muted-foreground">Convert videos to audio instantly</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full px-4 py-6">
          <div className="flex h-full flex-col gap-4">
            {/* Chat Thread */}
            <ScrollArea className="flex-1 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm">
              <div className="p-4">
                <ChatThread jobs={jobs} />
              </div>
            </ScrollArea>

            {/* Composer */}
            <div className="rounded-2xl border border-border/40 bg-card/50 p-4 shadow-lg backdrop-blur-sm">
              <ChatComposer onConvert={handleConvert} isProcessing={isProcessing} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} · Built with{' '}
            <span className="text-red-500">♥</span> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.hostname : 'vid2audio-chat'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-amber-600 transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
