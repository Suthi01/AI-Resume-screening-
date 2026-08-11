

interface SkillsSectionProps {
  skills?: string[];
}

export function SkillsSection({ skills }: SkillsSectionProps) {
  if (!skills || skills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
        >
          {skill}
        </span>
      ))}
    </div>
  );
}
