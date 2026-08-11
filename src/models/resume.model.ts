// src/models/resume.model.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IResume extends Document {
  id: string;

  name: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: any[];
  education: any[];
  embedding: number[] | null;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    name: { type: String, default: null },
    email: { type: String, default: null, index: { unique: true, sparse: true } },
    phone: { type: String, default: null },
    skills: { type: [String], default: [] },
    experience: { type: [Schema.Types.Mixed] as any, default: [] },
    education: { type: [Schema.Types.Mixed] as any, default: [] },
    embedding: { type: [Number], default: null },
  },
  { timestamps: true }
);

// Atlas Vector Search index definition (optional, can be added via UI or CLI)
// Example: db.resumes.createIndex({ embedding: "cosine", dimensions: 1024 })

export const ResumeModel: Model<IResume> = mongoose.model<IResume>('Resume', ResumeSchema);
