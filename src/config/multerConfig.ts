import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
   destination: (_req: any, _file: any, cb: any) => {
     // Ensure the uploads folder exists (creates if missing)
     const uploadPath = path.resolve('uploads');
     try {
       // Synchronously create the directory; no error if it already exists
       const fs = require('fs');
       if (!fs.existsSync(uploadPath)) {
         fs.mkdirSync(uploadPath, { recursive: true });
       }
     } catch (e) {
       // If folder creation fails, propagate the error to Multer
       return cb(e, null);
     }
     cb(null, uploadPath);
   },
  filename: (_req: any, file: any, cb: any) => {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export default upload;
