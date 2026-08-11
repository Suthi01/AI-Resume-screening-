import React from 'react';
import { FileText, X, AlertTriangle, CheckCircle, RotateCw } from 'lucide-react';

interface UploadProgressProps {
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  errorMsg?: string | null;
  onCancel?: () => void;
  onRetry?: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  fileName,
  fileSize,
  progress,
  status,
  errorMsg,
  onCancel,
  onRetry,
}) => {
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-400';
      case 'error':
        return 'bg-red-500';
      case 'uploading':
      default:
        return 'bg-gradient-to-r from-primary to-accent';
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-bg-surface border border-white/[0.07] rounded-lg shadow-sm">
      {/* File Details Row */}
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white/[0.03] border border-white/[0.05] rounded">
          <FileText className="w-6 h-6 text-text-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate" title={fileName}>
            {fileName}
          </p>
          <p className="text-xs text-text-muted">{formatSize(fileSize)}</p>
        </div>

        {/* Action Button */}
        {status === 'uploading' && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-1 hover:bg-white/[0.05] rounded-full text-text-muted hover:text-text-primary transition-all"
            title="Cancel upload"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress / Status Block */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          {status === 'uploading' && (
            <>
              <span className="text-primary">Uploading...</span>
              <span className="text-text-primary">{progress}%</span>
            </>
          )}
          {status === 'success' && (
            <span className="flex items-center gap-1.5 text-green-400">
              <CheckCircle className="w-3.5 h-3.5" />
              Upload Complete
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1.5 text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Upload Failed
            </span>
          )}
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-out ${getProgressBarColor()}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Error Message and Retry Action */}
      {status === 'error' && (
        <div className="flex flex-col gap-2 mt-1">
          {errorMsg && <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/10">{errorMsg}</p>}
          <div className="flex gap-2 justify-end">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-white/[0.05] border border-white/[0.07] rounded transition-all"
              >
                Clear
              </button>
            )}
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-text-primary bg-primary hover:bg-opacity-95 rounded transition-all shadow"
              >
                <RotateCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Clear/Reset button for Success state */}
      {status === 'success' && onCancel && (
        <div className="flex justify-end mt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-text-primary bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.07] rounded transition-all"
          >
            Upload Another
          </button>
        </div>
      )}
    </div>
  );
};
