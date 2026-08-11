// src/repositories/ResumeingestionRepository.ts
import { Db } from 'mongodb';
import { config } from '../config';

export class ResumeIngestionRepository {
  private readonly collection;

  constructor(db: Db) {
    this.collection = db.collection(config.mongodbCollection);
  }

  /**
   * Persists a resume document to the MongoDB database.
   * @param doc The resume document including embeddings and metadata.
   */
  async save(doc: any): Promise<any> {
    const result = await this.collection.insertOne(doc);
    return {
      _id: result.insertedId,
      id: result.insertedId.toString(),
      ...doc
    };
  }
}

// Alias for backward compatibility
export class ResumeingestionRepository extends ResumeIngestionRepository {}
