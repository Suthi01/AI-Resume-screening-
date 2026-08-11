import { X, MapPin, Briefcase } from 'lucide-react';

interface ModalHeaderProps {
  name: string;
  role?: string | null;
  company?: string | null;
  location?: string | null;
  totalExperience?: number;
  onClose: () => void;
}

export function ModalHeader({ name, role, company, location, totalExperience, onClose }: ModalHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-bg-card border-b border-white/[0.07] px-6 py-4 flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1 min-w-0">
        <h2 className="text-lg font-bold text-text-primary truncate">{name}</h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {role && (
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <Briefcase className="w-3 h-3" />
              {role}{company ? ` @ ${company}` : ''}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <MapPin className="w-3 h-3" />
              {location}
            </span>
          )}
          {totalExperience != null && totalExperience > 0 && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {totalExperience} yr{totalExperience !== 1 ? 's' : ''} exp
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
        aria-label="Close profile"
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
          bg-white/[0.04] hover:bg-white/[0.08] text-text-muted hover:text-text-primary
          transition-colors duration-150"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
