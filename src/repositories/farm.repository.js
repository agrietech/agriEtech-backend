const BaseRepository = require('./base.repository');
const { prisma } = require('../config/db');

/**
 * Farm Repository
 * Specialized repository for farm-related operations
 */
class FarmRepository extends BaseRepository {
  constructor() {
    super('farm');
  }

  /**
   * Find farms by user ID
   */
  async findByUserId(userId, include = {}) {
    return await this.findMany(
      { userId },
      {
        include: {
          woreda: { select: { id: true, nameEn: true, nameAm: true } },
          crop: true,
          sensors: true,
          ...include
        },
        orderBy: { createdAt: 'desc' }
      }
    );
  }

  /**
   * Find farms by woreda
   */
  async findByWoreda(woredaId, include = {}) {
    return await this.findMany(
      { woredaId },
      {
        include: {
          user: { select: { id: true, fullName: true, phoneNumber: true } },
          crop: true,
          ...include
        },
        orderBy: { createdAt: 'desc' }
      }
    );
  }

  /**
   * Find farm with sensors and latest readings
   */
  async findWithSensors(farmId) {
    return await this.findById(farmId, {
      sensors: {
        include: {
          readings: {
            take: 10,
            orderBy: { recordedAt: 'desc' }
          }
        }
      },
      woreda: { select: { id: true, nameEn: true, nameAm: true } },
      crop: true
    });
  }

  /**
   * Find farms with risk alerts
   */
  async findAtRisk(woredaId = null) {
    const where = woredaId ? { woredaId } : {};
    
    return await this.findMany(where, {
      include: {
        woreda: {
          include: {
            alerts: {
              where: { status: 'ACTIVE' },
              take: 5
            }
          }
        },
        sensors: {
          where: { isActive: true }
        }
      }
    });
  }

  /**
   * Get farm statistics
   */
  async getStatistics(woredaId = null) {
    const where = woredaId ? { woredaId } : {};

    const [total, areaSum, cropDistribution] = await Promise.all([
      this.count(where),
      this.aggregate({
        where,
        _sum: { areaHectares: true }
      }),
      this.groupBy({
        by: ['primaryCrop'],
        where,
        _count: true
      })
    ]);

    return {
      totalFarms: total,
      totalAreaHectares: areaSum._sum.areaHectares || 0,
      cropDistribution: cropDistribution.reduce((acc, item) => {
        if (item.primaryCrop) {
          acc[item.primaryCrop] = item._count;
        }
        return acc;
      }, {})
    };
  }
}

module.exports = new FarmRepository();
