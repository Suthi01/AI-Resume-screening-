// src/controllers/ingestionController.ts
import { Request, Response, NextFunction } from 'express';
import { getDatabase } from '../config/database';
import { config } from '../config';
import ResumeParserService from '../services/ResumeParserService';
import AlgorithmResumeParser from '../services/AlgorithmResumeParser';
import LLMResumeParser from '../services/LLMResumeParser';
import { EmbeddingService } from '../services/EmbeddingService';
import { ResumeingestionRepository } from '../repositories/ResumeingestionRepository';
import { ResumeingestionService } from '../services/ResumeingestionService';
import { cleanText } from '../utils/textCleaner';
import { AppError } from '../types/common.types';
import { logger } from '../services/LoggingService';

const getIngestionService = () => new ResumeingestionService(getDatabase());
const getEmbeddingService = () => new EmbeddingService(config);
const getRepo = () => new ResumeingestionRepository(getDatabase());

const ingestionController = {
  // Phase 2 – Upload PDF (validation done by multer)
  uploadResume: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('File missing', 400, 'BAD_REQUEST');
      }
      res.json({ message: 'File uploaded', filename: req.file.filename });
    } catch (err) {
      next(err);
    }
  },

  // Phase 3 – Extract Text
  extractText: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('File missing', 400, 'BAD_REQUEST');
      }
      let rawText: string;
      try {
        rawText = await ResumeParserService.extractTextFromPdf(req.file.path);
      } catch (err) {
        throw new AppError('Resume extraction failed', 400, 'EXTRACTION_FAILED');
      }
      res.json({ rawText });
    } catch (err) {
      next(err);
    }
  },

  // Phase 4 – Clean Text
  cleanText: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let rawText = req.body.rawText || req.body.text || '';
      if (req.file) {
        try {
          rawText = await ResumeParserService.extractTextFromPdf(req.file.path);
        } catch (err) {
          throw new AppError('Resume extraction failed', 400, 'EXTRACTION_FAILED');
        }
      }
      const cleaned = cleanText(rawText);
      res.json({ cleanedText: cleaned });
    } catch (err) {
      next(err);
    }
  },

  // Phase 5 – Algorithm Parser
  parseResume: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let cleanedText = req.body.cleanedText || req.body.rawText || req.body.text || '';
      if (req.file) {
        try {
          const rawText = await ResumeParserService.extractTextFromPdf(req.file.path);
          cleanedText = cleanText(rawText);
        } catch (err) {
          throw new AppError('Resume extraction failed', 400, 'EXTRACTION_FAILED');
        }
      }
      const parser = new AlgorithmResumeParser();
      const parsed = await parser.parseResume(cleanedText);
      res.json(parsed);
    } catch (err) {
      next(err);
    }
  },

  // Phase 7 – Skills Detection
  detectSkills: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let rawText = req.body.rawText || req.body.text || '';
      if (req.file) {
        try {
          rawText = await ResumeParserService.extractTextFromPdf(req.file.path);
        } catch (err) {
          throw new AppError('Resume extraction failed', 400, 'EXTRACTION_FAILED');
        }
      }
      const skills = await ResumeParserService.detectSkills(rawText);
      res.json(skills);
    } catch (err) {
      next(err);
    }
  },

  // Phase 8 – Optional LLM Parser
  llmParseResume: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let cleanedText = req.body.cleanedText || req.body.rawText || req.body.text || '';
      if (req.file) {
        try {
          const rawText = await ResumeParserService.extractTextFromPdf(req.file.path);
          cleanedText = cleanText(rawText);
        } catch (err) {
          throw new AppError('Resume extraction failed', 400, 'EXTRACTION_FAILED');
        }
      }

      if (!cleanedText || cleanedText.trim() === '') {
        throw new AppError('Resume content is empty', 400, 'VALIDATION_FAILED');
      }

      const jobDescription = req.body.jobDescription || req.body.jd || req.body.query || '';
      const parser = new LLMResumeParser();
      const parsed = await parser.parseResume(cleanedText, jobDescription);

      // Perform Phase 8 validations
      const nameTrimmed = (parsed.name || '').trim();
      if (!nameTrimmed || nameTrimmed.includes('@') || nameTrimmed.includes(':') || nameTrimmed.includes('/') || !/[a-zA-Z]/.test(nameTrimmed)) {
        throw new AppError('Parsed name missing', 400, 'VALIDATION_FAILED');
      }

      const { EMAIL_REGEX } = require('../utils/regex');
      if (!parsed.email || !EMAIL_REGEX.test(parsed.email)) {
        throw new AppError('Invalid email format', 400, 'VALIDATION_FAILED');
      }

      if (!parsed.skills || parsed.skills.length === 0) {
        throw new AppError('No skills available', 400, 'VALIDATION_FAILED');
      }

      res.json(parsed);
    } catch (err) {
      next(err);
    }
  },

  // Phase 9 – Embedding Generation
  generateEmbedding: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      let { name, role, skills, totalExperience, experience, education, rawText } = req.body;
      if (req.file) {
        try {
          const extractedText = await ResumeParserService.extractTextFromPdf(req.file.path);
          rawText = cleanText(extractedText);
          const parser = new AlgorithmResumeParser();
          const parsed = await parser.parseResume(rawText);
          name = parsed.name || name || '';
          role = parsed.role || role || '';
          skills = parsed.skills || skills || [];
          totalExperience = parsed.totalExperience !== undefined ? parsed.totalExperience : totalExperience;
          education = parsed.education || education || '';
        } catch (err) {
          throw new AppError('Resume extraction failed', 400, 'EXTRACTION_FAILED');
        }
      }
      const expVal = totalExperience !== undefined ? totalExperience : (experience !== undefined ? experience : 0);
      const skillsStr = Array.isArray(skills) ? skills.join(', ') : (skills || '');
      let eduStr = '';
      if (typeof education === 'string') {
        eduStr = education;
      } else if (Array.isArray(education)) {
        eduStr = education.map((e: any) => `${e.degree || ''} from ${e.institution || ''} in ${e.year || ''}`).join(', ');
      }
      const embeddingText = `${name || ''}\n${role || ''}\n${skillsStr}\n${expVal} years\n${eduStr}\n${rawText || ''}`;
      let embedResult;
      try {
        embedResult = await getEmbeddingService().generateEmbedding(embeddingText);
      } catch (err) {
        throw new AppError('Mistral embedding failed', 500, 'EMBEDDING_FAILED');
      }
      res.json({ embedding: embedResult.embedding });
    } catch (err) {
      next(err);
    }
  },

  // Phase 10 – MongoDB Ingestion
  storeResume: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resumeDoc = req.body;
      const formattedDoc = {
        ...resumeDoc,
        text: resumeDoc.rawText || resumeDoc.text,
        skills: Array.isArray(resumeDoc.skills) ? resumeDoc.skills : (typeof resumeDoc.skills === 'string' ? JSON.parse(resumeDoc.skills) : [])
      };
      let saved;
      try {
        saved = await getRepo().save(formattedDoc);
      } catch (err) {
        throw new AppError('Ingestion failed', 500, 'DATABASE_ERROR');
      }

      let phoneVal: any = saved.phone || '';
      const phoneDigits = typeof phoneVal === 'string' ? phoneVal.replace(/\D/g, '') : '';
      if (phoneDigits && phoneDigits.length >= 7) {
        phoneVal = Number(phoneDigits);
      }

      res.json({
        _id: saved._id ? saved._id.toString() : (saved.id || ''),
        text: saved.text || saved.rawText || '',
        embedding: saved.embedding || [],
        name: saved.name || '',
        email: saved.email || '',
        phone: phoneVal,
        location: saved.location || '',
        company: saved.company || '',
        role: saved.role || '',
        education: saved.education || '',
        totalExperience: saved.totalExperience !== undefined && saved.totalExperience !== null ? saved.totalExperience : 0,
        relevantExperience: saved.relevantExperience !== undefined && saved.relevantExperience !== null ? saved.relevantExperience : (saved.totalExperience || 0),
        skills: typeof saved.skills === 'string' ? saved.skills : JSON.stringify(saved.skills)
      });
    } catch (err) {
      next(err);
    }
  },

  // Phase 11 & 13 – Full Service + Timing Logging (single endpoint)
  injectResume: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new AppError('File missing', 400, 'BAD_REQUEST');
      }

      const { saved, timings } = await getIngestionService().injectResume(req.file);

      // Phase 13 Logging Requirement:
      logger.info({
        requestId: req.requestId || 'unknown',
        fileName: req.file.originalname,
        ...timings
      }, 'Resume Ingestion timings');

      let phoneVal: any = saved.phone || '';
      const phoneDigits = typeof phoneVal === 'string' ? phoneVal.replace(/\D/g, '') : '';
      if (phoneDigits && phoneDigits.length >= 7) {
        phoneVal = Number(phoneDigits);
      }

      res.json({
        _id: saved._id ? saved._id.toString() : (saved.id || ''),
        text: saved.text || saved.rawText || '',
        embedding: saved.embedding || [],
        name: saved.name || '',
        email: saved.email || '',
        phone: phoneVal,
        location: saved.location || '',
        company: saved.company || '',
        role: saved.role || '',
        education: saved.education || '',
        totalExperience: saved.totalExperience !== undefined && saved.totalExperience !== null ? saved.totalExperience : 0,
        relevantExperience: saved.relevantExperience !== undefined && saved.relevantExperience !== null ? saved.relevantExperience : (saved.totalExperience || 0),
        skills: typeof saved.skills === 'string' ? saved.skills : JSON.stringify(saved.skills)
      });
    } catch (err) {
      next(err);
    }
  },
};

export default ingestionController;
