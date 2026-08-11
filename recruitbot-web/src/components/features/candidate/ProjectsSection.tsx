interface ProjectsSectionProps {
  projects?: any[];
}

export function ProjectsSection({ projects }: ProjectsSectionProps) {
  if (!projects || projects.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Projects</h3>
      <ul className="list-disc list-inside space-y-1 text-sm text-text-primary">
        {projects.map((proj, i) => (
          <li key={i}>
            <strong>{proj.name}</strong>
            {proj.description && ` – ${proj.description}`}
            {proj.technologies && proj.technologies.length > 0 && (
              <span className="ml-2 text-xs text-text-muted">({proj.technologies.join(', ')})</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
