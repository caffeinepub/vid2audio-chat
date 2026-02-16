import { useState } from 'react';
import ChatThread from './components/ChatThread';
import ChatComposer from './components/ChatComposer';
import { useJobHistory } from '../jobs/useJobHistory';
import { useConversionMutation } from '../conversion/useConversionMutation';
import { fetchVideoFromUrl } from '../conversion/fetchVideoFromUrl';
import { detectRestrictedSource, getRestrictedSourceError } from '../conversion/restrictedSources';
import { useAppViewportHeight } from '@/hooks/useAppViewportHeight';
import { useChatAutoScroll } from '@/hooks/useChatAutoScroll';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

export default function ChatScreen() {
  const { jobs, addJob, updateJob } = useJobHistory();
  const [isProcessing, setIsProcessing] = useState(false);
  const conversionMutation = useConversionMutation();
  
  // Handle mobile viewport height
  useAppViewportHeight();
  
  // Auto-scroll management
  const { scrollContainerRef, isNearBottom, scrollToBottom, handleScroll } = useChatAutoScroll({
    threshold: 100,
    dependencies: [jobs.length, jobs[jobs.length - 1]?.status, jobs[jobs.length - 1]?.progress],
  });

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
        // Check for restricted sources before attempting fetch
        const restrictedSource = detectRestrictedSource(source);
        if (restrictedSource) {
          updateJob(jobId, {
            status: 'failed',
            error: getRestrictedSourceError(restrictedSource),
          });
          setIsProcessing(false);
          return;
        }

        // Update status to fetching
        updateJob(jobId, { status: 'fetching', progress: 0 });
        
        try {
          fileToConvert = await fetchVideoFromUrl(source);
          updateJob(jobId, { progress: 10 });
        } catch (error) {
          const errorMessage = error instanceof Error 
            ? error.message 
            : 'Failed to fetch video from URL. Please check the link and try again, or upload the file directly.';
          
          updateJob(jobId, {
            status: 'failed',
            error: errorMessage,
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
      updateJob(jobId, { status: 'converting', progress: 10 });

      // Perform conversion
      try {
        const result = await conversionMutation.mutateAsync({
          file: fileToConvert,
          format,
          onProgress: (progress) => {
            updateJob(jobId, { progress: Math.min(99, progress) });
          },
        });

        // Update job with success
        updateJob(jobId, {
          status: 'done',
          downloadUrl: result.url,
          filename: result.filename,
          progress: 100,
        });
      } catch (conversionError) {
        const errorMessage = conversionError instanceof Error 
          ? conversionError.message 
          : 'Conversion failed. Please try again with a different file or format.';
        
        updateJob(jobId, {
          status: 'failed',
          error: errorMessage,
          progress: undefined,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred. Please try again.';
      
      updateJob(jobId, {
        status: 'failed',
        error: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col bg-gradient-to-br from-background via-background to-accent/5" style={{ height: 'var(--app-height, 100vh)' }}>
      {/* Header */}
      <header className="shrink-0 border-b border-border/40 bg-card/50 backdrop-blur-sm">
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

      {/* Main Content - Scrollable Thread */}
      <main className="relative flex-1 overflow-hidden">
        <div className="container mx-auto h-full px-4 py-6">
          <div className="flex h-full flex-col gap-4">
            {/* Chat Thread - Scrollable Area */}
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto rounded-2xl border border-border/40 bg-card/30 p-4 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              tabIndex={0}
              style={{ scrollPaddingTop: '1rem', scrollPaddingBottom: '1rem' }}
            >
              <ChatThread jobs={jobs} />
            </div>

            {/* Scroll to Latest Button */}
            {!isNearBottom && (
              <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10">
                <Button
                  size="sm"
                  onClick={() => scrollToBottom(true)}
                  className="shadow-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Scroll to latest
                </Button>
              </div>
            )}

            {/* Composer */}
            <div className="shrink-0 rounded-2xl border border-border/40 bg-card/50 p-4 shadow-lg backdrop-blur-sm">
              <ChatComposer onConvert={handleConvert} isProcessing={isProcessing} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-border/40 bg-card/30 backdrop-blur-sm">
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
