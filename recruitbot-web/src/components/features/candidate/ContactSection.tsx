import { Mail, Phone, MapPin } from 'lucide-react';

interface ContactSectionProps {
  email?: string | null;
  phone?: string | number | null;
  location?: string | null;
}

export function ContactSection({ email, phone, location }: ContactSectionProps) {
  const hasAny = email || phone || location;
  if (!hasAny) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Contact</h3>
      <div className="flex flex-col gap-2">
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2.5 text-sm text-text-primary hover:text-primary transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            {email}
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="flex items-center gap-2.5 text-sm text-text-primary hover:text-primary transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            {String(phone)}
          </a>
        )}
        {location && (
          <span className="flex items-center gap-2.5 text-sm text-text-muted">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            {location}
          </span>
        )}
      </div>
    </div>
  );
}
