// src/routes/upload.routes.ts
import { Router, Request, Response, NextFunction } from 'express';
import upload from '../config/multerConfig';
import { UploadController } from '../controllers/upload.controller';

const router = Router();
const controller = new UploadController();

router.post(
  '/resume/upload',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller.upload(req, res);
    } catch (err) {
      next(err);
    }
  }
);

export { router as uploadRoutes };
