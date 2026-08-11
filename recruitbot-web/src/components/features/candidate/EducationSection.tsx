import type { Education } from '@/types/candidate.types';
interface EducationSectionProps {
  education?: Education[];
}

export function EducationSection({ education }: EducationSectionProps) {
  if (!education || !Array.isArray(education) || education.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Education</h3>
      {education.map((edu, idx) => (
        <p key={idx} className="text-sm text-text-primary whitespace-pre-wrap">
          {edu.degree}{edu.institution ? ` @ ${edu.institution}` : ''}{edu.year ? ` (${edu.year})` : ''}
        </p>
      ))}
    </section>
  );
}
