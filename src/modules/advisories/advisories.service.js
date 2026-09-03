const { prisma } = require('../../config/db');
const { NotFoundError, BadRequestError } = require('../../utils/errors');
const logger = require('../../utils/logger');

/**
 * Advisories Service
 * Manages actionable agronomic and disaster advisories with full multilingual support.
 */

async function getAdvisories({
  woredaId,
  zoneId,
  regionId,
  hazardType,
  cropType,
  status = 'ACTIVE',
  limit = 50,
  offset = 0,
}) {
  const where = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (hazardType) {
    where.hazardType = hazardType;
  }

  if (cropType) {
    where.cropType = cropType;
  }

  if (woredaId) {
    where.woredaId = woredaId;
  } else if (zoneId) {
    where.woreda = { zoneId };
  } else if (regionId) {
    where.woreda = { zone: { regionId } };
  }

  const [advisories, total] = await Promise.all([
    prisma.advisory.findMany({
      where,
      take: parseInt(limit, 10) || 50,
      skip: parseInt(offset, 10) || 0,
      orderBy: { issuedAt: 'desc' },
      include: {
        woreda: {
          select: {
            id: true,
            nameEn: true,
            nameAm: true,
            zone: {
              select: {
                id: true,
                nameEn: true,
                nameAm: true,
                region: {
                  select: { id: true, nameEn: true, nameAm: true, code: true },
                },
              },
            },
          },
        },
        alert: {
          select: {
            id: true,
            severity: true,
            hazardType: true,
            status: true,
            sentAt: true,
          },
        },
      },
    }),
    prisma.advisory.count({ where }),
  ]);

  return { advisories, total, limit: parseInt(limit, 10), offset: parseInt(offset, 10) };
}

async function getAdvisoryById(id) {
  const advisory = await prisma.advisory.findUnique({
    where: { id },
    include: {
      woreda: {
        include: {
          zone: {
            include: { region: true },
          },
        },
      },
      alert: true,
    },
  });

  if (!advisory) {
    throw new NotFoundError('Advisory not found');
  }

  return advisory;
}

async function createAdvisory(data) {
  const {
    alertId,
    woredaId,
    cropType,
    hazardType,
    severity,
    titleEn,
    titleAm,
    titleOm,
    adviceEn,
    adviceAm,
    adviceOm,
    actionItems,
    validUntil,
  } = data;

  if (!woredaId || !hazardType || !severity || !titleEn || !titleAm || !adviceEn || !adviceAm) {
    throw new BadRequestError('Missing required advisory fields (woredaId, hazardType, severity, titleEn, titleAm, adviceEn, adviceAm)');
  }

  // Verify woreda exists
  const woreda = await prisma.woreda.findUnique({ where: { id: woredaId } });
  if (!woreda) {
    throw new NotFoundError(`Woreda '${woredaId}' does not exist`);
  }

  const advisory = await prisma.advisory.create({
    data: {
      alertId: alertId || null,
      woredaId,
      cropType: cropType || null,
      hazardType,
      severity,
      titleEn,
      titleAm,
      titleOm: titleOm || null,
      adviceEn,
      adviceAm,
      adviceOm: adviceOm || null,
      actionItems: actionItems ? (typeof actionItems === 'string' ? JSON.parse(actionItems) : actionItems) : null,
      validUntil: validUntil ? new Date(validUntil) : null,
      status: 'ACTIVE',
      issuedAt: new Date(),
    },
    include: {
      woreda: true,
    },
  });

  // Automatically dispatch notification to users in this woreda
  try {
    const usersInWoreda = await prisma.user.findMany({
      where: { woredaId },
      select: { id: true, preferredLang: true },
    });

    if (usersInWoreda.length > 0) {
      const notificationsData = usersInWoreda.map((u) => ({
        userId: u.id,
        titleEn: `Agronomic Advisory: ${titleEn}`,
        titleAm: `የግብርና ምክረ-ሀሳብ: ${titleAm}`,
        bodyEn: adviceEn,
        bodyAm: adviceAm,
        type: 'ADVISORY',
        metadata: { advisoryId: advisory.id, hazardType, severity },
      }));

      await prisma.notification.createMany({
        data: notificationsData,
      });
      logger.info(`[Advisories] Dispatched advisory notification to ${usersInWoreda.length} users in woreda ${woredaId}`);
    }
  } catch (notifErr) {
    logger.warn(`[Advisories] Notification dispatch warning: ${notifErr.message}`);
  }

  return advisory;
}

async function updateAdvisory(id, data) {
  const existing = await prisma.advisory.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Advisory not found');
  }

  return await prisma.advisory.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

async function deleteAdvisory(id) {
  const existing = await prisma.advisory.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Advisory not found');
  }

  await prisma.advisory.delete({ where: { id } });
  return { message: 'Advisory deleted successfully' };
}

module.exports = {
  getAdvisories,
  getAdvisoryById,
  createAdvisory,
  updateAdvisory,
  deleteAdvisory,
};
