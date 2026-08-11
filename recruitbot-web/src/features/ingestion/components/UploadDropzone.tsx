import React, { useState } from 'react';
import { FileText, UploadCloud } from 'lucide-react';
import { UploadButton } from './UploadButton';

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onFileSelect,
  onError,
  disabled = false,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const validateAndProcessFile = (file: File) => {
    // PDF validation
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      onError('Only PDF allowed');
      return;
    }

    // Size validation (5MB limit)
    const isLt5MB = file.size <= 5 * 1024 * 1024;
    if (!isLt5MB) {
      onError('Maximum 5MB allowed');
      return;
    }

    onFileSelect(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragActive(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    } else {
      onError('Please select a file');
    }
  };

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center min-h-[220px] p-6 border-2 border-dashed rounded-lg transition-all ${
        isDragActive
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-white/[0.07] hover:border-white/[0.15] bg-bg-surface'
      } ${disabled ? 'opacity-40 cursor-not-allowed hover:border-white/[0.07]' : 'cursor-pointer'}`}
    >
      <div className="flex flex-col items-center text-center gap-3">
        {isDragActive ? (
          <UploadCloud className="w-12 h-12 text-primary animate-bounce" />
        ) : (
          <FileText className="w-12 h-12 text-text-muted" />
        )}

        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-text-primary">
            {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume here'}
          </p>
          <p className="text-xs text-text-muted">Supports: PDF (Max 5MB)</p>
        </div>

        {!isDragActive && (
          <>
            <span className="text-xs text-text-muted font-medium uppercase tracking-wider">or</span>
            <UploadButton onFileSelect={onFileSelect} onError={onError} disabled={disabled} />
          </>
        )}
      </div>
    </div>
  );
};
