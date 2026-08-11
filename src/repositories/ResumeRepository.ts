import { Db, Document } from 'mongodb';
import { IResumeDocument, ResumeSearchResult } from '../types/resume.types';
import { SearchFilters } from '../types/search.types';
import { config } from '../config';
import { logger } from '../services/LoggingService';

export class ResumeRepository {
  private readonly collection;

  constructor(db: Db) {
    this.collection = db.collection<IResumeDocument>(config.mongodbCollection);
  }

  /**
   * Helper to map MongoDB documents to API responses
   */
  private mapToSearchResult(doc: Document, searchType: 'bm25' | 'vector' | 'hybrid'): ResumeSearchResult {
    let parsedSkills: string[] = [];
    try {
      if (doc.skills) {
        parsedSkills = typeof doc.skills === 'string' ? JSON.parse(doc.skills) : doc.skills;
      }
    } catch (e) {
      // Fallback if not valid JSON
      parsedSkills = typeof doc.skills === 'string' ? doc.skills.split(',').map((s: string) => s.trim()) : [];
    }

    const snippet = doc.text ? doc.text.substring(0, 500) + (doc.text.length > 500 ? '...' : '') : '';

    return {
      resumeId: doc._id.toString(),
      name: doc.name || 'Unknown',
      email: doc.email || '',
      role: doc.role || '',
      company: doc.company || '',
      location: doc.location || '',
      skills: parsedSkills,
      totalExperience: doc.totalExperience || doc.total_Experience || 0,
      relevantExperience: doc.relevantExperience || doc.relevant_Experience || 0,
      education: doc.education || '',
      snippet,
      score: doc.score,
      searchType
    };
  }

  /**
   * Full-text search using MongoDB Atlas Search (BM25 scoring).
   *
   * Strategy:
   *  - Text filters (location, role, skills) → Atlas Search compound.filter
   *    (benefits from the search index, contributes to scoring)
   *  - Numeric filters (experience range) → $match stage AFTER $search
   *    (avoids requiring total_Experience to be declared in the Atlas Search
   *     index definition — range inside compound.filter only works when the
   *     numeric field is indexed in Atlas Search, otherwise it returns nothing)
   */
  async bm25Search(query: string, filters: SearchFilters = {}, topK: number = 20): Promise<ResumeSearchResult[]> {
    const indexName = config.mongodbBm25IndexName || 'default';

    // ── 1. Atlas Search must: full-text relevance ─────────────────
    const mustClauses: Document[] = [
      {
        text: {
          query,
          path: ['text', 'skills', 'role', 'education']
        }
      }
    ];

    // ── 2. Atlas Search filter: text-only filters ─────────────────
    const searchFilterClauses: Document[] = [];

    if (filters.location) {
      searchFilterClauses.push({
        text: { query: filters.location, path: 'location' }
      });
    }

    if (filters.role) {
      searchFilterClauses.push({
        text: { query: filters.role, path: 'role' }
      });
    }

    if (filters.skills && filters.skills.length > 0) {
      searchFilterClauses.push({
        text: { query: filters.skills.join(' '), path: 'skills' }
      });
    }

    // ── 3. Post-search $match: numeric field filters ──────────────
    const matchClause: Document = {};

    if (filters.minYearsExperience !== undefined) {
      matchClause.totalExperience = {
        ...matchClause.totalExperience,
        $gte: filters.minYearsExperience
      };
    }

    if (filters.maxYearsExperience !== undefined) {
      matchClause.totalExperience = {
        ...matchClause.totalExperience,
        $lte: filters.maxYearsExperience
      };
    }

    // ── 4. Build pipeline ─────────────────────────────────────────
    const searchStage: Document = {
      $search: {
        index: indexName,
        compound: {
          must: mustClauses,
          filter: searchFilterClauses.length > 0 ? searchFilterClauses : undefined
        }
      }
    };

    const pipeline: Document[] = [searchStage];

    // Inject $match for numeric filters before $limit so topK is respected
    if (Object.keys(matchClause).length > 0) {
      pipeline.push({ $match: matchClause });
    }

    pipeline.push(
      { $limit: topK },
      {
        $project: {
          text: 1,
          name: 1,
          email: 1,
          role: 1,
          company: 1,
          location: 1,
          skills: 1,
          totalExperience: 1,
          relevantExperience: 1,
          education: 1,
          score: { $meta: 'searchScore' }
        }
      }
    );

    logger.info(
      {
        collection: config.mongodbCollection,
        index: indexName,
        query,
        topK,
        searchFilterCount: searchFilterClauses.length,
        matchFilterFields: Object.keys(matchClause),
        filters,
      },
      'BM25 search started'
    );

    try {
      const results = await this.collection.aggregate(pipeline).toArray();

      logger.info(
        { collection: config.mongodbCollection, index: indexName, query, resultCount: results.length },
        'BM25 search completed'
      );

      return results.map(doc => this.mapToSearchResult(doc, 'bm25'));
    } catch (err: any) {
      logger.error(
        {
          collection: config.mongodbCollection,
          index: indexName,
          query,
          errorMessage: err?.message,
          errorCode: err?.code,
          pipeline: JSON.stringify(pipeline),
        },
        'BM25 search pipeline failed'
      );
      throw err;
    }
  }


  /**
   * Vector search using Atlas Vector Search
   */
  async vectorSearch(embedding: number[], filters: SearchFilters = {}, topK: number = 20): Promise<ResumeSearchResult[]> {
    const filterClauses: Document[] = [];

    if (filters.minYearsExperience !== undefined) {
      filterClauses.push({ totalExperience: { $gte: filters.minYearsExperience } });
    }
    if (filters.maxYearsExperience !== undefined) {
      filterClauses.push({ totalExperience: { $lte: filters.maxYearsExperience } });
    }
    if (filters.location) {
      filterClauses.push({ location: filters.location });
    }
    if (filters.role) {
      filterClauses.push({ role: filters.role });
    }
    if (filters.skills && filters.skills.length > 0) {
      // Very basic substring/regex fallback or exact match. Vector search $match is standard MongoDB query.
      filterClauses.push({ skills: { $regex: filters.skills.join('|'), $options: 'i' } });
    }

    const vectorStageParams: Record<string, unknown> = {
      index: config.mongodbVectorIndexName || 'vector_index',
      path: 'embedding',
      queryVector: embedding,
      numCandidates: topK * 4,
      limit: topK,
    };

    // Only add `filter` when clauses exist — Atlas Vector Search rejects filter:undefined
    if (filterClauses.length > 0) {
      vectorStageParams.filter = { $and: filterClauses };
    }

    const vectorStage: Document = {
      $vectorSearch: vectorStageParams,
    };


    const pipeline = [
      vectorStage,
      {
        $project: {
          text: 1,
          name: 1,
          email: 1,
          role: 1,
          company: 1,
          location: 1,
          skills: 1,
          totalExperience: 1,
          relevantExperience: 1,
          education: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    const results = await this.collection.aggregate(pipeline).toArray();
    return results.map(doc => this.mapToSearchResult(doc, 'vector'));
  }

  async findById(id: string): Promise<IResumeDocument | null> {
    const { ObjectId } = require('mongodb');
    return this.collection.findOne({ _id: new ObjectId(id) });
  }

  async countDocuments(): Promise<number> {
    return this.collection.countDocuments();
  }

  /**
   * Persists a resume document to MongoDB using the native collection.
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

