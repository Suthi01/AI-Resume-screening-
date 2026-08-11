import { Router, Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { ResumeRepository } from '../repositories/ResumeRepository';
import { AppError } from '../types/common.types';

const router = Router();

let resumeRepository: ResumeRepository;

function getRepo() {
  if (!resumeRepository) {
    const db = getDatabase();
    resumeRepository = new ResumeRepository(db);
  }
  return resumeRepository;
}

/**
 * GET /v1/candidate/:id
 * Returns a full candidate profile by resumeId (MongoDB ObjectId).
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id || id.length !== 24) {
      throw new AppError('Invalid candidate ID', 400, 'INVALID_ID');
    }

    const repo = getRepo();
    const doc = await repo.findById(id);

    if (!doc) {
      throw new AppError('Candidate not found', 404, 'NOT_FOUND');
    }

    // Parse skills — stored as JSON string or comma list
    let skills: string[] = [];
    try {
      skills = typeof doc.skills === 'string' ? JSON.parse(doc.skills) : (doc.skills as unknown as string[]) ?? [];
    } catch {
      skills = typeof doc.skills === 'string'
        ? doc.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
    }

    // Build response — omit embedding to save bandwidth
    const profile = {
      id: doc._id.toString(),
      name: doc.name ?? 'Unknown',
      email: doc.email ?? null,
      phone: doc.phone ?? null,
      location: doc.location ?? null,
      role: doc.role ?? null,
      company: doc.company ?? null,
      education: doc.education ?? null,
      totalExperience: doc.totalExperience ?? 0,
      relevantExperience: doc.relevantExperience ?? 0,
      skills,
      summary: (doc as any).summary ?? null,
      text: doc.text ? doc.text.substring(0, 3000) : null,
      // Structured arrays — may or may not exist depending on ingestion parser
      experience: (doc as any).experience ?? [],
      projects: (doc as any).projects ?? [],
      certifications: (doc as any).certifications ?? [],
    };

    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
});

export { router as candidateRoutes };
