interface CertificationsSectionProps {
  certifications?: any[];
}

export function CertificationsSection({ certifications }: CertificationsSectionProps) {
  if (!certifications || certifications.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Certifications</h3>
      <ul className="list-disc list-inside space-y-1 text-sm text-text-primary">
        {certifications.map((cert, i) => (
          <li key={i}>
            <strong>{cert.name}</strong>
            {cert.issuer && ` – ${cert.issuer}`}
            {cert.year && ` (${cert.year})`}
          </li>
        ))}
      </ul>
    </section>
  );
}
