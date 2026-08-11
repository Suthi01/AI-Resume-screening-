// src/tests/unit/ResumeingestionService.test.ts
import { ResumeingestionService, ResumeIngestionService } from '../../services/ResumeingestionService';
import ResumeParserService from '../../services/ResumeParserService';
import { EmbeddingService } from '../../services/EmbeddingService';
import { ResumeIngestionRepository } from '../../repositories/ResumeingestionRepository';
import { AppError } from '../../types/common.types';
import { Db } from 'mongodb';

// Mock the modules
jest.mock('../../services/ResumeParserService');
jest.mock('../../services/EmbeddingService');
jest.mock('../../repositories/ResumeIngestionRepository');

describe('ResumeingestionService and ResumeIngestionService', () => {
  let service: ResumeingestionService;
  let serviceCapital: ResumeIngestionService;
  let mockDb: jest.Mocked<Db>;
  let mockRepositoryInstance: any;
  let mockEmbeddingServiceInstance: any;

  beforeEach(() => {
    mockDb = {} as any;

    mockRepositoryInstance = {
      save: jest.fn().mockResolvedValue({ id: 'saved-id', name: 'John Doe' }),
    };
    (ResumeIngestionRepository as jest.Mock).mockImplementation(() => mockRepositoryInstance);

    mockEmbeddingServiceInstance = {
      generateEmbedding: jest.fn().mockResolvedValue({
        embedding: [0.1, 0.2],
        dimensions: 2,
        model: 'mistral-embed',
        usageTokens: 10,
      }),
    };
    (EmbeddingService as jest.Mock).mockImplementation(() => mockEmbeddingServiceInstance);

    service = new ResumeingestionService(mockDb);
    serviceCapital = new ResumeIngestionService(mockDb);

    // Default static mocks
    ResumeParserService.extractTextFromPdf = jest.fn().mockResolvedValue('John Doe\nDeveloper\njohn.doe@example.com\nSkills: Java');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully orchestrate ingestion and return document and timings', async () => {
    const mockFile = {
      path: 'dummy.pdf',
      originalname: 'john_doe.pdf',
    } as any;

    const result = await service.injectResume(mockFile);

    expect(ResumeParserService.extractTextFromPdf).toHaveBeenCalledTimes(1);
    expect(ResumeParserService.extractTextFromPdf).toHaveBeenCalledWith('dummy.pdf');
    expect(mockEmbeddingServiceInstance.generateEmbedding).toHaveBeenCalledTimes(1);
    expect(mockRepositoryInstance.save).toHaveBeenCalledTimes(1);

    expect(result.saved).toEqual({ id: 'saved-id', name: 'John Doe' });
    expect(result.timings).toHaveProperty('extractMs');
    expect(result.timings).toHaveProperty('parseMs');
    expect(result.timings).toHaveProperty('embeddingMs');
    expect(result.timings).toHaveProperty('mongoInsertMs');

    // Test capital cased service
    const resultCapital = await serviceCapital.injectResume(mockFile);
    expect(resultCapital.saved).toEqual({ id: 'saved-id', name: 'John Doe' });
  });

  it('should throw AppError if file is missing', async () => {
    await expect(service.injectResume(null as any)).rejects.toThrow(
      new AppError('File missing', 400, 'BAD_REQUEST')
    );
  });

  it('should throw AppError with extraction failed if text extraction fails', async () => {
    const mockFile = { path: 'dummy.pdf', originalname: 'john_doe.pdf' } as any;
    ResumeParserService.extractTextFromPdf = jest.fn().mockRejectedValue(new Error('PDF error'));

    await expect(service.injectResume(mockFile)).rejects.toThrow(
      new AppError('Resume extraction failed', 400, 'EXTRACTION_FAILED')
    );
  });

  it('should throw AppError with validation failed if extracted text is empty', async () => {
    const mockFile = { path: 'dummy.pdf', originalname: 'john_doe.pdf' } as any;
    ResumeParserService.extractTextFromPdf = jest.fn().mockResolvedValue('');

    await expect(service.injectResume(mockFile)).rejects.toThrow(
      new AppError('Resume content is empty', 400, 'VALIDATION_FAILED')
    );
  });

  it('should throw AppError with validation failed if parsed name is missing', async () => {
    const mockFile = { path: 'dummy.pdf', originalname: 'john_doe.pdf' } as any;
    ResumeParserService.extractTextFromPdf = jest.fn().mockResolvedValue('email: john.doe@example.com\nSkills: Java');

    await expect(service.injectResume(mockFile)).rejects.toThrow(
      new AppError('Parsed name missing', 400, 'VALIDATION_FAILED')
    );
  });

  it('should throw AppError with validation failed if email is invalid', async () => {
    const mockFile = { path: 'dummy.pdf', originalname: 'john_doe.pdf' } as any;
    ResumeParserService.extractTextFromPdf = jest.fn().mockResolvedValue('John Doe\nDeveloper\nno-email\nSkills: Java');

    await expect(service.injectResume(mockFile)).rejects.toThrow(
      new AppError('Invalid email format', 400, 'VALIDATION_FAILED')
    );
  });

  it('should throw AppError with validation failed if skills are missing', async () => {
    const mockFile = { path: 'dummy.pdf', originalname: 'john_doe.pdf' } as any;
    ResumeParserService.extractTextFromPdf = jest.fn().mockResolvedValue('John Doe\nDeveloper\njohn.doe@example.com\nSkills: none');

    await expect(service.injectResume(mockFile)).rejects.toThrow(
      new AppError('No skills available', 400, 'VALIDATION_FAILED')
    );
  });

  it('should throw AppError with embedding failed if embedding generation fails', async () => {
    const mockFile = { path: 'dummy.pdf', originalname: 'john_doe.pdf' } as any;
    mockEmbeddingServiceInstance.generateEmbedding.mockRejectedValue(new Error('API error'));

    await expect(service.injectResume(mockFile)).rejects.toThrow(
      new AppError('Mistral embedding failed', 500, 'EMBEDDING_FAILED')
    );
  });

  it('should throw AppError with ingestion failed if DB save fails', async () => {
    const mockFile = { path: 'dummy.pdf', originalname: 'john_doe.pdf' } as any;
    mockRepositoryInstance.save.mockRejectedValue(new Error('Mongo error'));

    await expect(service.injectResume(mockFile)).rejects.toThrow(
      new AppError('Ingestion failed', 500, 'DATABASE_ERROR')
    );
  });
});
