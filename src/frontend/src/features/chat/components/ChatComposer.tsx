import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link2, Upload, Sparkles, AlertTriangle } from 'lucide-react';
import { isValidUrl } from '../../validation/urlValidation';
import { detectRestrictedSource, getRestrictedSourceWarning } from '../../conversion/restrictedSources';

interface ChatComposerProps {
  onConvert: (inputType: 'link' | 'upload', source: string | File, format: 'mp3' | 'wav') => void;
  isProcessing: boolean;
}

export default function ChatComposer({ onConvert, isProcessing }: ChatComposerProps) {
  const [inputType, setInputType] = useState<'link' | 'upload'>('link');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'mp3' | 'wav'>('mp3');

  const canConvert =
    !isProcessing &&
    format &&
    ((inputType === 'link' && isValidUrl(url)) || (inputType === 'upload' && file !== null));

  // Check if the URL is from a restricted source (even without scheme)
  const restrictedSource = inputType === 'link' && url.trim() ? detectRestrictedSource(url) : null;

  const handleConvert = () => {
    if (!canConvert) return;

    if (inputType === 'link') {
      onConvert('link', url, format);
      setUrl('');
    } else {
      onConvert('upload', file!, format);
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={inputType} onValueChange={(v) => setInputType(v as 'link' | 'upload')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="link" className="gap-2">
            <Link2 className="h-4 w-4" />
            Video Link
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="link" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="url-input">Video URL</Label>
            <Input
              id="url-input"
              type="url"
              placeholder="https://example.com/video.mp4"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isProcessing}
              className="bg-background/50"
            />
            {url && !isValidUrl(url) && !restrictedSource && (
              <p className="text-xs text-destructive">Please enter a valid URL</p>
            )}
            {restrictedSource && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {getRestrictedSourceWarning(restrictedSource)}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="file-input">Video File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-input"
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                disabled={isProcessing}
                className="bg-background/50"
              />
            </div>
            {file && (
              <p className="text-xs text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="format-select">Output Format</Label>
          <Select value={format} onValueChange={(v) => setFormat(v as 'mp3' | 'wav')}>
            <SelectTrigger id="format-select" className="bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mp3">MP3 (compressed)</SelectItem>
              <SelectItem value="wav">WAV (uncompressed)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleConvert}
          disabled={!canConvert}
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50"
          size="lg"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Convert
        </Button>
      </div>
    </div>
  );
}
