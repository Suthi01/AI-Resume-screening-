import React, { useState } from 'react';
import { UploadDropzone } from './UploadDropzone';
import { IngestionProgressSteps } from './IngestionProgressSteps';
import { IngestionResultScreen } from './IngestionResultScreen';
import { AlertCircle, AlertTriangle, RotateCw } from 'lucide-react';
import { useIngestionStore } from '../stores/ingestion.store';

export const ResumeUploadCard: React.FC = () => {
  const {
    uploadLoading,
    uploadProgress,
    ingestionSuccess,
    ingestionError,
    uploadedFile,
    steps,
    resultMetadata,
    uploadFile,
    resetStore,
  } = useIngestionStore();

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile) {
      setValidationError('Please select a file');
      resetStore();
      return;
    }
    setValidationError(null);
    uploadFile(selectedFile).catch((_err) => {
      // Errors are handled globally in the store
    });
  };

  const handleValidationError = (errorMessage: string) => {
    setValidationError(errorMessage);
    resetStore();
  };

  const handleCancel = () => {
    resetStore();
    setValidationError(null);
  };

  const handleRetry = () => {
    if (uploadedFile) {
      handleFileSelect(uploadedFile);
    }
  };

  const isIdle = !uploadLoading && !ingestionSuccess && !ingestionError;

  return (
    <div className="w-full max-w-md mx-auto bg-bg-card border border-white/[0.07] hover:border-white/[0.12] rounded-xl shadow-xl overflow-hidden transition-all duration-300">
      {/* Card Header with brand gradient border accent */}
      <div className="h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-accent" />
      
      <div className="p-6 flex flex-col gap-5">
        {/* Hide header details on success screen for cleaner UI */}
        {!ingestionSuccess && (
          <div className="flex flex-col gap-1.5">
            <h2 className="text-lg font-bold text-text-primary">Resume Ingestion</h2>
            <p className="text-xs text-text-muted">
              Add new candidates to your search database by uploading their PDF resumes.
            </p>
          </div>
        )}

        {/* Validation Errors for Idle State */}
        {isIdle && validationError && (
          <div className="flex items-start gap-2.5 p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/15 rounded-md">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Validation Error:</span> {validationError}
            </div>
          </div>
        )}

        {/* Dynamic States */}
        {isIdle && (
          <UploadDropzone
            onFileSelect={handleFileSelect}
            onError={handleValidationError}
          />
        )}

        {(uploadLoading || ingestionError) && (
          <div className="flex flex-col gap-4">
            {uploadedFile && (
              <div className="text-xs text-text-muted bg-white/[0.02] border border-white/[0.04] p-2.5 rounded flex items-center justify-between">
                <span className="truncate max-w-[280px] font-medium" title={uploadedFile.name}>
                  File: {uploadedFile.name}
                </span>
                <span className="shrink-0 text-[10px]">
                  {parseFloat((uploadedFile.size / (1024 * 1024)).toFixed(2))} MB
                </span>
              </div>
            )}

            {/* Stepper Pipeline */}
            <IngestionProgressSteps steps={steps} uploadProgress={uploadProgress} />

            {/* Ingestion Errors Block */}
            {ingestionError && (
              <div className="flex flex-col gap-3 mt-1.5 animate-fade-in">
                <div className="flex items-start gap-2.5 p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/15 rounded-md">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold">Ingestion Failed:</span> {ingestionError}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3 py-1.5 text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-white/[0.05] border border-white/[0.07] rounded-lg transition-all"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-text-primary bg-primary hover:bg-opacity-90 rounded-lg active:scale-95 transition-all shadow-md focus:outline-none"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Retry Ingestion
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {ingestionSuccess && (
          <IngestionResultScreen
            metadata={resultMetadata}
            onReset={handleCancel}
          />
        )}
      </div>
    </div>
  );
};
export default ResumeUploadCard;
