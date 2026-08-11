import { ResumeRepository } from '../../repositories/ResumeRepository';
import { Db, Collection } from 'mongodb';

describe('ResumeRepository', () => {
  let repository: ResumeRepository;
  let mockDb: jest.Mocked<Db>;
  let mockCollection: jest.Mocked<Collection>;

  beforeEach(() => {
    mockCollection = {
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: 'test-id',
            text: 'test text',
            skills: '["Java", "Node.js"]',
            role: 'Developer',
            totalExperience: 5,
            score: 0.9,
          }
        ])
      }),
      findOne: jest.fn(),
      countDocuments: jest.fn(),
    } as any;

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    } as any;

    repository = new ResumeRepository(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('bm25Search', () => {
    it('should build correct aggregation pipeline with query', async () => {
      await repository.bm25Search('test query', {}, 10);
      
      expect(mockCollection.aggregate).toHaveBeenCalledTimes(1);
      const pipeline = (mockCollection.aggregate as jest.Mock).mock.calls[0][0];
      
      // Check $search stage
      expect(pipeline[0]).toHaveProperty('$search');
      expect(pipeline[0].$search.compound.must[0].text.query).toBe('test query');
      
      // Check $limit stage
      expect(pipeline[1]).toEqual({ $limit: 10 });
    });

    it('should add filter clauses when filters are provided', async () => {
      await repository.bm25Search('test query', { 
        minYearsExperience: 3,
        skills: ['React', 'Node'] 
      }, 20);

      const pipeline = (mockCollection.aggregate as jest.Mock).mock.calls[0][0];
      
      // Check that the text filter is inside Atlas Search compound.filter
      const searchFilters = pipeline[0].$search.compound.filter;
      expect(searchFilters).toBeDefined();
      expect(searchFilters).toHaveLength(1);
      expect(searchFilters[0].text.query).toBe('React Node');

      // Check that the numeric filter is inside the post-search $match stage
      expect(pipeline[1]).toEqual({
        $match: {
          totalExperience: { $gte: 3 }
        }
      });
    });

    it('should parse skills correctly from json string', async () => {
      const results = await repository.bm25Search('test', {}, 10);
      
      expect(results[0].skills).toEqual(['Java', 'Node.js']);
      expect(results[0].searchType).toBe('bm25');
    });
  });

  describe('vectorSearch', () => {
    it('should build correct aggregation pipeline for vector search', async () => {
      const dummyEmbedding = [0.1, 0.2, 0.3];
      await repository.vectorSearch(dummyEmbedding, { role: 'Developer' }, 5);
      
      const pipeline = (mockCollection.aggregate as jest.Mock).mock.calls[0][0];
      
      expect(pipeline[0]).toHaveProperty('$vectorSearch');
      expect(pipeline[0].$vectorSearch.queryVector).toEqual(dummyEmbedding);
      expect(pipeline[0].$vectorSearch.limit).toBe(5);
      expect(pipeline[0].$vectorSearch.numCandidates).toBe(20); // 5 * 4
      
      // Check post-filter
      expect(pipeline[0].$vectorSearch.filter).toHaveProperty('$and');
      expect(pipeline[0].$vectorSearch.filter.$and[0]).toEqual({ role: 'Developer' });
    });
  });
});
