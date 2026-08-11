// src/tests/unit/ResumeingestionRepository.test.ts
import { ResumeingestionRepository, ResumeIngestionRepository } from '../../repositories/ResumeingestionRepository';
import { Db, Collection } from 'mongodb';

describe('ResumeingestionRepository and ResumeIngestionRepository', () => {
  let repository: ResumeingestionRepository;
  let repoCapital: ResumeIngestionRepository;
  let mockDb: jest.Mocked<Db>;
  let mockCollection: jest.Mocked<Collection>;

  beforeEach(() => {
    mockCollection = {
      insertOne: jest.fn().mockResolvedValue({
        acknowledged: true,
        insertedId: 'mock-inserted-id',
      }),
    } as any;

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any;

    repository = new ResumeingestionRepository(mockDb);
    repoCapital = new ResumeIngestionRepository(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save a document to the collection and return insertion details', async () => {
      const doc = { name: 'Test Candidate', role: 'Developer' };
      
      // Test lowercase class
      const result = await repository.save(doc);
      expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
      expect(mockCollection.insertOne).toHaveBeenLastCalledWith(doc);
      expect(result).toEqual({
        _id: 'mock-inserted-id',
        id: 'mock-inserted-id',
        name: 'Test Candidate',
        role: 'Developer',
      });

      // Test capital class
      const resultCapital = await repoCapital.save(doc);
      expect(mockCollection.insertOne).toHaveBeenCalledTimes(2);
      expect(mockCollection.insertOne).toHaveBeenLastCalledWith(doc);
      expect(resultCapital).toEqual({
        _id: 'mock-inserted-id',
        id: 'mock-inserted-id',
        name: 'Test Candidate',
        role: 'Developer',
      });
    });

    it('should propagate errors if insertion fails', async () => {
      mockCollection.insertOne.mockRejectedValue(new Error('DB Error'));

      await expect(repository.save({})).rejects.toThrow('DB Error');
      await expect(repoCapital.save({})).rejects.toThrow('DB Error');
    });
  });
});
