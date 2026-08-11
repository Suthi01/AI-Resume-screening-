import { ObjectId } from 'mongodb';

// ─── MongoDB Document Shape ──────────────────────────────────────

/**
 * Raw resume document as stored in the `resumes` collection.
 */
export interface IResumeDocument {
  _id: ObjectId;
  text: string;
  embedding: number[];
  name: string;
  email: string;
  phone: string | null;
  location: string;
  company: string;
  role: string;
  education: string;
  totalExperience: number;
  relevantExperience: number;
  skills: string; // JSON-stringified array, e.g. '["Java","Python"]'
}

// ─── Parsed Resume ───────────────────────────────────────────────

/**
 * Resume with skills parsed into a proper array (used in API responses).
 */
export interface ResumeSearchResult {
  resumeId: string;
  name: string;
  email: string;
  role: string;
  company: string;
  location: string;
  skills: string[];
  totalExperience: number;
  relevantExperience: number;
  education: string;
  snippet: string;
  score?: number;
  bm25Score?: number;
  vectorScore?: number;
  sources?: Array<'bm25' | 'vector' | 'hybrid'>;
  searchType: 'bm25' | 'vector' | 'hybrid';
}

// ─── Parsed Resume (Ingestion) ───────────────────────────────────

/**
 * Structured resume representation produced by parsers before DB storage.
 */
export interface Resume {
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  company: string;
  role: string;
  education: any;
  totalExperience: number;
  summary?: string;
  confidenceScore?: number;
  validationStatus?: string;
}

