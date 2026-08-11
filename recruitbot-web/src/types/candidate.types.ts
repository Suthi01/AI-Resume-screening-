export interface Experience {
  company: string;
  title: string;
  duration?: string;
  description?: string;
}

export interface Education {
  degree: string;
  institution?: string;
  year?: string;
}

export interface Project {
  name: string;
  description?: string;
  technologies?: string[];
}

export interface Certification {
  name: string;
  issuer?: string;
  year?: string;
}

export interface CandidateProfile {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | number | null;
  location?: string | null;
  role?: string | null;
  company?: string | null;
  education?: Education[];
  totalExperience?: number;
  relevantExperience?: number;
  skills?: string[];
  summary?: string | null;
  text?: string | null;
  experience?: Experience[];
  projects?: Project[];
  certifications?: Certification[];
}
