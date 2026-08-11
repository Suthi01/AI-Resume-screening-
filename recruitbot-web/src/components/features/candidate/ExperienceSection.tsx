interface ExperienceSectionProps {
  experience?: any[]; // We'll type loosely – backend may return empty array
}

export function ExperienceSection({ experience }: ExperienceSectionProps) {
  if (!experience || experience.length === 0) return null;
  return (
    <section className="space-y-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Experience</h3>
      <ul className="border-l border-primary/30 ml-2 pl-4 space-y-4">
        {experience.map((exp, idx) => (
          <li key={idx} className="relative">
            <div className="absolute -left-3 top-0.5 w-2 h-2 rounded-full bg-primary" />
            <p className="text-sm font-medium text-text-primary">{exp.title || exp.company}</p>
            <p className="text-xs text-text-muted">
              {exp.company}{exp.duration ? ` • ${exp.duration}` : ''}
            </p>
            {exp.description && (
              <p className="mt-1 text-xs text-text-muted whitespace-pre-wrap">
                {exp.description}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
