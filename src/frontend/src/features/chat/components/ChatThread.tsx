import { ConversionJob } from '../../jobs/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Download, Link2, Upload, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ChatThreadProps {
  jobs: ConversionJob[];
}

export default function ChatThread({ jobs }: ChatThreadProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-orange-600/20">
          <svg
            className="h-10 w-10 text-amber-600"
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
          <h3 className="text-lg font-semibold">Ready to convert</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Paste a video link or upload a file to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <Card key={job.id} className="overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm">
          <div className="p-4">
            {/* Job Header */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-600/20">
                {job.inputType === 'link' ? (
                  <Link2 className="h-5 w-5 text-amber-600" />
                ) : (
                  <Upload className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs">
                    {job.format.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(job.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium truncate" title={job.sourceLabel}>
                  {job.sourceLabel}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4">
              {job.status === 'pending' && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Preparing...</span>
                </div>
              )}

              {job.status === 'fetching' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Fetching video from URL...</span>
                  </div>
                  {job.progress !== undefined && job.progress > 0 && (
                    <Progress value={job.progress} className="h-2" />
                  )}
                </div>
              )}

              {job.status === 'converting' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Converting to {job.format.toUpperCase()}...</span>
                    {job.progress !== undefined && (
                      <span className="ml-auto font-medium">{Math.round(job.progress)}%</span>
                    )}
                  </div>
                  {job.progress !== undefined && (
                    <Progress value={job.progress} className="h-2" />
                  )}
                </div>
              )}

              {job.status === 'done' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Conversion complete!</span>
                  </div>
                  {job.downloadUrl && job.filename && (
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = job.downloadUrl!;
                        a.download = job.filename!;
                        a.click();
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download {job.format.toUpperCase()}
                    </Button>
                  )}
                </div>
              )}

              {job.status === 'failed' && job.error && (
                <Alert variant="destructive" className="border-red-200 dark:border-red-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {job.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
