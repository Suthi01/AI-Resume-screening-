// src/controllers/upload.controller.ts
import { Request, Response } from 'express';
import { logger } from '../services/LoggingService';
import fs from 'fs';
import { getDatabase } from '../config/database';
import { ResumeRepository } from '../repositories/ResumeRepository';

export class UploadController {
  async upload(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded', requestId });
    }
    // Store file metadata in MongoDB (optional rawText can be added later)
    try {
      const fileBuffer = await fs.promises.readFile(req.file.path);
      const repo = new ResumeRepository(getDatabase());
      await repo.save({
        fileName: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date(),
        fileData: fileBuffer.toString('base64') // store as base64 string
      });
    } catch (dbErr) {
      // Log but do not fail the request – DB is optional for now
      logger.error({ err: dbErr }, 'Failed to store upload metadata in MongoDB');
    }
    return res.status(200).json({
      success: true,
      fileName: req.file.filename,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
}
