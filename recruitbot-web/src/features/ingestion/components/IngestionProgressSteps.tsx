import React from 'react';
import { Check, Loader2, X } from 'lucide-react';
import type { IngestionStep } from '../stores/ingestion.store';

interface IngestionProgressStepsProps {
  steps: IngestionStep[];
  uploadProgress: number;
}

export const IngestionProgressSteps: React.FC<IngestionProgressStepsProps> = ({
  steps,
  uploadProgress,
}) => {
  const getStepIcon = (status: IngestionStep['status']) => {
    switch (status) {
      case 'done':
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 shadow-sm shadow-green-500/5">
            <Check className="w-3.5 h-3.5" />
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 shadow-sm shadow-red-500/5">
            <X className="w-3.5 h-3.5" />
          </div>
        );
      case 'in-progress':
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 border border-primary/30 text-primary shadow-sm shadow-primary/5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/[0.03] border border-white/[0.05] text-text-muted text-xs font-semibold">
            •
          </div>
        );
    }
  };

  const getLabelColor = (status: IngestionStep['status']) => {
    switch (status) {
      case 'done':
        return 'text-text-primary font-medium';
      case 'failed':
        return 'text-red-400 font-semibold';
      case 'in-progress':
        return 'text-primary font-semibold';
      case 'pending':
      default:
        return 'text-text-muted';
    }
  };

  return (
    <div className="flex flex-col gap-4 py-2 px-1">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="relative flex items-start gap-4">
            {/* Connector Line */}
            {!isLast && (
              <div
                className={`absolute left-[11px] top-6 w-[2px] h-[calc(100%-12px)] transition-all duration-300 ${
                  step.status === 'done' ? 'bg-green-500/30' : 'bg-white/[0.07]'
                }`}
              />
            )}

            {/* Icon Circle */}
            <div className="relative z-10 shrink-0 select-none">
              {getStepIcon(step.status)}
            </div>

            {/* Label and Info */}
            <div className="flex-1 min-w-0 pt-0.5 flex items-center justify-between gap-3">
              <span className={`text-xs transition-colors duration-300 ${getLabelColor(step.status)}`}>
                {step.label}
              </span>
              
              {/* Extra context for file upload step */}
              {step.id === 'upload' && step.status === 'in-progress' && (
                <span className="text-[10px] font-semibold text-primary tabular-nums">
                  {uploadProgress}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default IngestionProgressSteps;
