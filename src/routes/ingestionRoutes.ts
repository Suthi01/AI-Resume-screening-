// src/routes/ingestionRoutes.ts
import { Router, Request, Response, NextFunction } from 'express';
import ingestionController from '../controllers/ingestionController';
import upload from '../config/multerConfig';
import { AppError } from '../types/common.types';

const router = Router();

// Helper middleware to handle multer file upload errors and map them to standard AppErrors
const handlePdfUpload = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    let replaced = false;
    const transformer = new (require('stream').Transform)({
      transform(chunk: any, _encoding: any, callback: any) {
        if (!replaced) {
          let chunkStr = chunk.toString('binary');
          if (chunkStr.includes('name=""')) {
            chunkStr = chunkStr.replace(/name=""/g, 'name="file"');
            this.push(Buffer.from(chunkStr, 'binary'));
            replaced = true;
            callback();
            return;
          }
        }
        this.push(chunk);
        callback();
      }
    });

    req.pipe(transformer);

    req.pipe = function (dest: any, options: any) {
      return transformer.pipe(dest, options);
    } as any;
  }

  upload.any()(req, res, (err: any) => {
    if (err) {
      if (err.message === 'Only PDF files are allowed' || err.code === 'LIMIT_FILE_TYPE') {
        return next(new AppError('Only PDF allowed', 400, 'INVALID_FILE_TYPE'));
      }
      if (err.message === 'Field name missing' || err.code === 'MISSING_FIELD_NAME') {
        return next(new AppError('Field name missing', 400, 'MISSING_FIELD_NAME'));
      }
      return next(new AppError(err.message || 'File upload error', 400, 'UPLOAD_ERROR'));
    }
    // Set req.file to the first file in req.files if available for compatibility
    const files = (req as any).files;
    if (files && files.length > 0) {
      req.file = files[0];
    }
    next();
  });
};



// Upload PDF
router.post(
  '/resume/upload',
  handlePdfUpload,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ingestionController.uploadResume(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

// Extract Text
router.post(
  '/resume/extract',
  handlePdfUpload,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ingestionController.extractText(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

// Clean Text
router.post(
  '/resume/clean',
  handlePdfUpload,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ingestionController.cleanText(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

// Parse Resume (Algorithm)
router.post(
  '/resume/parse',
  handlePdfUpload,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ingestionController.parseResume(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

// Skills Detection
router.post(
  '/resume/skills',
  handlePdfUpload,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ingestionController.detectSkills(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

// Optional LLM Parse
router.post(
  '/resume/llm-parse',
  handlePdfUpload,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ingestionController.llmParseResume(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

// Generate Embedding
router.post(
  '/resume/embed',
  handlePdfUpload,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ingestionController.generateEmbedding(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

// Store in MongoDB
router.post(
  '/resume/store',
  handlePdfUpload,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ingestionController.storeResume(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

// Full Ingestion Flow (single endpoint)
router.post(
  '/resume/inject',
  handlePdfUpload,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ingestionController.injectResume(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
