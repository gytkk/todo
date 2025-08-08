import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app';
import { BaseRedisRepository } from '../base-redis.repository';
import { generateId } from '../../utils/id-generator';

// Test entity
interface TestEntity {
  id: string;
  name: string;
  value: number;
  createdAt: Date;
}

// Test repository implementation
class TestRepository extends BaseRedisRepository<TestEntity> {
  protected entityName = 'test';

  protected serialize(entity: TestEntity): Record<string, string> {
    return {
      id: entity.id,
      name: entity.name,
      value: entity.value.toString(),
      createdAt: entity.createdAt.toISOString(),
    };
  }

  protected deserialize(data: Record<string, string>): TestEntity {
    return {
      id: data.id,
      name: data.name,
      value: parseInt(data.value),
      createdAt: new Date(data.createdAt),
    };
  }

  protected createEntity(data: Partial<TestEntity>): TestEntity {
    return {
      id: data.id || generateId('test'),
      name: data.name || 'Test',
      value: data.value || 0,
      createdAt: data.createdAt || new Date(),
    };
  }

  protected updateEntity(existing: TestEntity, updates: Partial<TestEntity>): TestEntity {
    return {
      ...existing,
      ...updates,
      id: existing.id, // ID는 변경 불가
    };
  }
}

describe('BaseRedisRepository', () => {
  let app: FastifyInstance;
  let repository: TestRepository;

  beforeAll(async () => {
    app = await buildApp({ logger: false });
    repository = new TestRepository(app);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    const keys = await app.redis.keys('todo:test:*');
    if (keys.length > 0) {
      await app.redis.del(...keys);
    }
  });

  describe('create', () => {
    it('should create a new entity', async () => {
      const entity = await repository.create({
        name: 'Test Item',
        value: 42,
      });

      expect(entity.id).toBeDefined();
      expect(entity.name).toBe('Test Item');
      expect(entity.value).toBe(42);
      expect(entity.createdAt).toBeInstanceOf(Date);
    });

    it('should add entity to list', async () => {
      const entity = await repository.create({
        name: 'Test Item',
      });

      const all = await repository.findAll();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(entity.id);
    });
  });

  describe('findById', () => {
    it('should find entity by id', async () => {
      const created = await repository.create({
        name: 'Test Item',
        value: 100,
      });

      const found = await repository.findById(created.id);
      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Item');
      expect(found?.value).toBe(100);
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update existing entity', async () => {
      const created = await repository.create({
        name: 'Original',
        value: 10,
      });

      const updated = await repository.update(created.id, {
        name: 'Updated',
        value: 20,
      });

      expect(updated).toBeDefined();
      expect(updated?.id).toBe(created.id);
      expect(updated?.name).toBe('Updated');
      expect(updated?.value).toBe(20);
    });

    it('should return null for non-existent entity', async () => {
      const updated = await repository.update('non-existent', {
        name: 'Updated',
      });

      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing entity', async () => {
      const created = await repository.create({
        name: 'To Delete',
      });

      const deleted = await repository.delete(created.id);
      expect(deleted).toBe(true);

      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent entity', async () => {
      const deleted = await repository.delete('non-existent');
      expect(deleted).toBe(false);
    });

    it('should remove entity from list', async () => {
      const created = await repository.create({
        name: 'To Delete',
      });

      await repository.delete(created.id);

      const all = await repository.findAll();
      expect(all).toHaveLength(0);
    });
  });

  describe('exists', () => {
    it('should return true for existing entity', async () => {
      const created = await repository.create({
        name: 'Exists',
      });

      const exists = await repository.exists(created.id);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent entity', async () => {
      const exists = await repository.exists('non-existent');
      expect(exists).toBe(false);
    });
  });

  describe('findPaginated', () => {
    beforeEach(async () => {
      // Create test data
      for (let i = 1; i <= 15; i++) {
        await repository.create({
          name: `Item ${i}`,
          value: i,
        });
      }
    });

    it('should return paginated results', async () => {
      const result = await repository.findPaginated({
        page: 1,
        limit: 10,
      });

      expect(result.items).toHaveLength(10);
      expect(result.total).toBe(15);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it('should return correct page', async () => {
      const result = await repository.findPaginated({
        page: 2,
        limit: 10,
      });

      expect(result.items).toHaveLength(5);
      expect(result.page).toBe(2);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });
  });
});