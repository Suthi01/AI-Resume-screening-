import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { ModalHeader } from '@/components/features/candidate/ModalHeader';
import { ContactSection } from '@/components/features/candidate/ContactSection';
import { SkillsSection } from '@/components/features/candidate/SkillsSection';
import { ExperienceSection } from '@/components/features/candidate/ExperienceSection';
import { EducationSection } from '@/components/features/candidate/EducationSection';
import { ProjectsSection } from '@/components/features/candidate/ProjectsSection';
import { CertificationsSection } from '@/components/features/candidate/CertificationsSection';
import { useCandidateModal } from '@/hooks/use-candidate-modal';

export function CandidateModal() {
  const { isOpen, candidate, loading, closeModal } = useCandidateModal();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [textExpanded, setTextExpanded] = useState(false);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closeModal]);

  // Reset text expanded state when modal closes
  useEffect(() => {
    if (!isOpen) setTextExpanded(false);
  }, [isOpen]);

  // Click overlay to close (but not when clicking inside card)
  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) closeModal();
  };

  // Focus trap
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (isOpen) closeBtnRef.current?.focus();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/50"
          ref={overlayRef}
          onClick={onOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-bg-card rounded-xl w-full max-w-[660px] max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-white/[0.07]"
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0, transition: { duration: 0.2 } }}
            exit={{ scale: 0.92, opacity: 0, y: 16, transition: { duration: 0.15 } }}
          >
            {loading ? (
              <div className="p-6 space-y-3 animate-pulse">
                <div className="h-6 w-48 bg-white/10 rounded" />
                <div className="h-4 w-32 bg-white/10 rounded" />
                <div className="h-4 w-64 bg-white/10 rounded" />
                <div className="h-4 w-48 bg-white/10 rounded" />
              </div>
            ) : candidate ? (
              <>
                <ModalHeader
                  name={candidate.name}
                  role={candidate.role}
                  company={candidate.company}
                  location={candidate.location}
                  totalExperience={candidate.totalExperience}
                  onClose={closeModal}
                />

                <div className="p-6 space-y-6">
                  {/* Experience Stats Row */}
                  {(candidate.totalExperience != null || candidate.relevantExperience != null) && (
                    <div className="flex items-center gap-3 flex-wrap">
                      {candidate.totalExperience != null && candidate.totalExperience > 0 && (
                        <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2">
                          <Clock className="w-3.5 h-3.5 text-text-muted" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-text-muted uppercase tracking-wide">Total Exp</span>
                            <span className="text-sm font-bold text-text-primary">{candidate.totalExperience} yr{candidate.totalExperience !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      )}
                      {candidate.relevantExperience != null && candidate.relevantExperience > 0 && (
                        <div className="flex items-center gap-1.5 bg-primary/[0.06] border border-primary/20 rounded-lg px-3 py-2">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-primary/70 uppercase tracking-wide">Relevant Exp</span>
                            <span className="text-sm font-bold text-primary">{candidate.relevantExperience} yr{candidate.relevantExperience !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <ContactSection
                    email={candidate.email}
                    phone={candidate.phone}
                    location={candidate.location}
                  />
                  <SkillsSection skills={candidate.skills} />
                  <ExperienceSection experience={candidate.experience} />
                  <EducationSection education={candidate.education} />
                  <ProjectsSection projects={candidate.projects} />
                  <CertificationsSection certifications={candidate.certifications} />

                  {/* Full Resume Text */}
                  {candidate.text && (
                    <section className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setTextExpanded((v) => !v)}
                        className="w-full flex items-center justify-between gap-2 group focus:outline-none"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-text-muted" />
                          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted group-hover:text-text-primary transition-colors">
                            Full Resume Text
                          </h3>
                          <span className="text-[10px] text-text-muted/60 font-normal normal-case tracking-normal">
                            ({candidate.text.length.toLocaleString()} chars)
                          </span>
                        </div>
                        {textExpanded
                          ? <ChevronUp className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors" />
                          : <ChevronDown className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-colors" />
                        }
                      </button>

                      <AnimatePresence initial={false}>
                        {textExpanded && (
                          <motion.div
                            key="resume-text"
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            className="bg-bg-base/60 border border-white/[0.06] rounded-lg p-4"
                          >
                            <pre className="text-xs text-text-muted/90 whitespace-pre-wrap leading-relaxed font-mono break-words">
                              {candidate.text}
                            </pre>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </section>
                  )}
                </div>
              </>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

