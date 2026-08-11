import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';

export function ResumeUploadButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5 MB).');
      return;
    }

    const form = new FormData();
    form.append('file', file);

    setIsUploading(true);
    try {
      await toast.promise(
        apiClient.post('/v1/resume/inject', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }),
        {
          loading: 'Ingesting and parsing resume...',
          success: 'Resume uploaded and stored in MongoDB!',
          error: (err: any) => `Upload failed: ${err?.response?.data?.message ?? err.message}`,
        }
      );
    } catch (err) {
      // toast.promise handles showing the error, so we just catch it to avoid unhandled rejections
    } finally {
      setIsUploading(false);
      // Reset the file input so the same file can be chosen again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        aria-label="Upload resume PDF"
        className="w-full text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-white/[0.04] border-white/[0.05] bg-bg-card/25 gap-2 transition-all h-9"
      >
        {isUploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
        Ingest Resume
      </Button>
    </div>
  );
}

export default ResumeUploadButton;
