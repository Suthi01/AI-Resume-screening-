import React from 'react';
import { CheckCircle2, Search, ArrowRight, Mail, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';

interface IngestionResultScreenProps {
  metadata: {
    _id?: string;
    name?: string;
    email?: string;
    phone?: string | number;
    location?: string;
    company?: string;
    role?: string;
    totalExperience?: number;
    skills?: string | string[];
  } | null;
  onReset: () => void;
}

export const IngestionResultScreen: React.FC<IngestionResultScreenProps> = ({
  metadata,
  onReset,
}) => {
  const handleSearchClick = () => {
    toast.success('Routing to Candidate Search Chat (Phase 15)...', {
      icon: '🔍',
      duration: 3000,
    });
  };

  const getSkillsArray = (): string[] => {
    if (!metadata || !metadata.skills) return [];
    if (Array.isArray(metadata.skills)) return metadata.skills;
    if (typeof metadata.skills === 'string') {
      try {
        const parsed = JSON.parse(metadata.skills);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return metadata.skills.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const skills = getSkillsArray();

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Banner & Success Checkmarks */}
      <div className="flex flex-col gap-4 text-center items-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 shadow-lg shadow-green-500/5 animate-pulse">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold text-text-primary">Ingestion Complete</h3>
          <p className="text-xs text-text-muted">The candidate profile has been successfully parsed and indexed.</p>
        </div>

        {/* Audit Pipeline Confirms */}
        <div className="w-full grid grid-cols-2 gap-2 text-left bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg">
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <span className="text-green-400">✓</span> Resume uploaded
          </div>
          <div className="flex item-center gap-1.5 text-[10px] text-text-muted">
            <span className="text-green-400">✓</span> Embedding generated
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <span className="text-green-400">✓</span> MongoDB ingested
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <span className="text-green-400">✓</span> Vector search ready
          </div>
        </div>
      </div>

      {/* Structured parsed Candidate Box */}
      {metadata && (
        <div className="flex flex-col gap-3 p-4 bg-bg-surface border border-white/[0.05] rounded-lg shadow-inner">
          <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.04]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center text-primary font-semibold text-xs shrink-0 uppercase">
              {metadata.name ? metadata.name.charAt(0) : 'C'}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-text-primary truncate">{metadata.name || 'Unknown Candidate'}</h4>
              <p className="text-[10px] text-text-muted truncate">{metadata.role || 'Software Engineer'}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 text-xs">
            {metadata.email && (
              <div className="flex items-center gap-2 text-text-muted">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{metadata.email}</span>
              </div>
            )}
            {metadata.totalExperience !== undefined && (
              <div className="flex items-center gap-2 text-text-muted">
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span>Experience: {metadata.totalExperience} years</span>
              </div>
            )}
            {skills.length > 0 && (
              <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-white/[0.03]">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Detected Skills</span>
                <div className="flex flex-wrap gap-1">
                  {skills.slice(0, 8).map((skill, index) => (
                    <span
                      key={index}
                      className="text-[9px] font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/10"
                    >
                      {skill}
                    </span>
                  ))}
                  {skills.length > 8 && (
                    <span className="text-[9px] font-medium text-text-muted px-1.5 py-0.5">
                      +{skills.length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA Control Row */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleSearchClick}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-white bg-gradient-to-r from-primary to-accent hover:opacity-95 rounded-lg active:scale-[0.98] shadow-md shadow-primary/10 transition-all focus:outline-none"
        >
          <Search className="w-3.5 h-3.5" />
          Search Candidates Now
          <ArrowRight className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2 px-4 text-xs font-semibold text-text-primary bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] rounded-lg active:scale-[0.98] transition-all focus:outline-none"
        >
          Upload Another Resume
        </button>
      </div>
    </div>
  );
};
export default IngestionResultScreen;
