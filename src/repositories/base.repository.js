const { prisma } = require('../config/db');

/**
 * Base Repository Pattern
 * Provides common CRUD operations with caching support
 */
class BaseRepository {
  constructor(modelName) {
    this.modelName = modelName;
    this.model = prisma[modelName];
  }

  /**
   * Find by ID
   */
  async findById(id, include = {}) {
    return await this.model.findUnique({
      where: { id },
      include
    });
  }

  /**
   * Find many with filters
   */
  async findMany(where = {}, options = {}) {
    return await this.model.findMany({
      where,
      ...options
    });
  }

  /**
   * Find first matching record
   */
  async findFirst(where = {}, options = {}) {
    return await this.model.findFirst({
      where,
      ...options
    });
  }

  /**
   * Create new record
   */
  async create(data) {
    return await this.model.create({ data });
  }

  /**
   * Create many records
   */
  async createMany(data, skipDuplicates = false) {
    return await this.model.createMany({
      data,
      skipDuplicates
    });
  }

  /**
   * Update by ID
   */
  async update(id, data) {
    return await this.model.update({
      where: { id },
      data
    });
  }

  /**
   * Update many records
   */
  async updateMany(where, data) {
    return await this.model.updateMany({
      where,
      data
    });
  }

  /**
   * Upsert (update or create)
   */
  async upsert(where, create, update) {
    return await this.model.upsert({
      where,
      create,
      update
    });
  }

  /**
   * Delete by ID
   */
  async delete(id) {
    return await this.model.delete({
      where: { id }
    });
  }

  /**
   * Delete many records
   */
  async deleteMany(where) {
    return await this.model.deleteMany({ where });
  }

  /**
   * Count records
   */
  async count(where = {}) {
    return await this.model.count({ where });
  }

  /**
   * Aggregate
   */
  async aggregate(options) {
    return await this.model.aggregate(options);
  }

  /**
   * Group by
   */
  async groupBy(options) {
    return await this.model.groupBy(options);
  }

  /**
   * Check if record exists
   */
  async exists(where) {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Execute in transaction
   */
  async transaction(callback) {
    return await prisma.$transaction(callback);
  }
}

module.exports = BaseRepository;
