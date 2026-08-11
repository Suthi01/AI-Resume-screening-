// src/services/ResumeingestionService.ts
import { Db } from 'mongodb';
import { config } from '../config';
import ResumeParserService from './ResumeParserService';
import { cleanText } from '../utils/textCleaner';
import AlgorithmResumeParser from './AlgorithmResumeParser';
import LLMResumeParser from './LLMResumeParser';
import { EmbeddingService } from './EmbeddingService';
import { ResumeIngestionRepository } from '../repositories/ResumeingestionRepository';
import { AppError } from '../types/common.types';

export interface IngestionTimings {
  extractMs: number;
  parseMs: number;
  embeddingMs: number;
  mongoInsertMs: number;
}

export class ResumeIngestionService {
  protected readonly repository: ResumeIngestionRepository;
  protected readonly embeddingService: EmbeddingService;

  constructor(db: Db) {
    this.repository = new ResumeIngestionRepository(db);
    this.embeddingService = new EmbeddingService(config);
  }

  /**
   * Orchestrates the complete resume ingestion pipeline.
   * @param file Uploaded express multer file object
   * @param forceLlm Force using LLM parser instead of configuration default
   * @param textInput Direct raw resume text input
   */
  async injectResume(file?: Express.Multer.File, forceLlm: boolean = false, textInput?: string): Promise<{
    saved: any;
    timings: IngestionTimings;
  }> {
    if (!file && !textInput) {
      throw new AppError('File missing', 400, 'BAD_REQUEST');
    }

    // 1. Extract raw text from PDF
    const t0 = performance.now();
    let rawText: string;
    let fileName = 'text-input';
    if (textInput) {
      rawText = textInput;
    } else {
      const filePath = file!.path;
      fileName = file!.originalname;
      try {
        rawText = await ResumeParserService.extractTextFromPdf(filePath);
      } catch (err: any) {
        throw new AppError('Resume extraction failed', 400, 'EXTRACTION_FAILED');
      }
    }
    const extractMs = Math.round(performance.now() - t0);

    // 2. Clean/Normalize the text & Parse fields (LLM or algorithmic depending on config)
    const t1 = performance.now();
    const cleaned = cleanText(rawText);
    const parser = (forceLlm || process.env.USE_LLM_PARSER === 'true')
      ? new LLMResumeParser()
      : new AlgorithmResumeParser();
    const parsed = await parser.parseResume(cleaned);
    const parseMs = Math.round(performance.now() - t1);

    // Validate parsed metadata (checking Name exists, Email format, Skills available, and Resume not empty)
    this.validateParsedResume(parsed, cleaned);

    // 3. Generate embedding vector
    const t2 = performance.now();
    const skillsStr = (parsed.skills || []).join(', ');
    let eduStr = '';
    if (typeof parsed.education === 'string') {
      eduStr = parsed.education;
    } else if (Array.isArray(parsed.education)) {
      eduStr = parsed.education.map((e: any) => `${e.degree || ''} from ${e.institution || ''} in ${e.year || ''}`).join(', ');
    }
    const embeddingText = `${parsed.name}\n${parsed.role}\n${skillsStr}\n${parsed.totalExperience || 0} years\n${eduStr}\n${cleaned}`;
    let embedResult;
    try {
      embedResult = await this.embeddingService.generateEmbedding(embeddingText);
    } catch (err: any) {
      throw new AppError('Mistral embedding failed', 500, 'EMBEDDING_FAILED');
    }
    const embeddingMs = Math.round(performance.now() - t2);

    // 4. Build final document and persist to MongoDB
    const t3 = performance.now();
    const document = {
      ...parsed,
      embedding: embedResult.embedding,
      embeddingModel: config.mistralEmbedModel,
      embeddingDimension: config.mistralEmbedDimensions,
      fileName,
      rawText: cleaned,
      text: cleaned, // for retrieval compatibility
      skills: parsed.skills // store natively as an array of strings
    };

    let saved;
    try {
      saved = await this.repository.save(document);
    } catch (err: any) {
      throw new AppError('Ingestion failed', 500, 'DATABASE_ERROR');
    }
    const mongoInsertMs = Math.round(performance.now() - t3);

    return {
      saved,
      timings: {
        extractMs,
        parseMs,
        embeddingMs,
        mongoInsertMs,
      }
    };
  }

  /**
   * Validates the parsed resume metadata and content.
   */
  protected validateParsedResume(parsed: any, cleanedText: string): void {
    if (!cleanedText || cleanedText.trim() === '') {
      throw new AppError('Resume content is empty', 400, 'VALIDATION_FAILED');
    }
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
  }
}

// Alias for backward compatibility
export class ResumeingestionService extends ResumeIngestionService {}
