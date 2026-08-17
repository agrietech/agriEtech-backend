const prismaMock = {
  farm: { create: jest.fn() },
  $executeRaw: jest.fn(),
};
prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock));

jest.mock('../../src/config/db', () => ({
  prisma: prismaMock,
  isConnected: jest.fn(),
}));

jest.mock('../../src/modules/boundaries/boundaries.service', () => ({
  getWoredaById: jest.fn(),
}));

const { prisma, isConnected } = require('../../src/config/db');
const boundariesService = require('../../src/modules/boundaries/boundaries.service');
const farmsService = require('../../src/modules/farms/farms.service');

const woreda = {
  id: 'woreda-1',
  geojson: {
    type: 'Polygon',
    coordinates: [
      [
        [39, 8],
        [40, 8],
        [40, 9],
        [39, 9],
        [39, 8],
      ],
    ],
  },
};

const farmInput = {
  userId: 'user-1',
  farmName: 'Teff plot',
  primaryCrop: 'Teff',
  areaHectares: 2,
  woredaId: 'woreda-1',
  polygonGeojson: {
    type: 'Polygon',
    coordinates: [
      [
        [39.2, 8.2],
        [39.4, 8.2],
        [39.4, 8.4],
        [39.2, 8.4],
        [39.2, 8.2],
      ],
    ],
  },
};

describe('farm registration persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isConnected.mockReturnValue(true);
    boundariesService.getWoredaById.mockResolvedValue(woreda);
    prisma.farm.create.mockResolvedValue({ id: 'farm-1' });
  });

  it('persists a contained farm as GeoJSON and PostGIS geometry', async () => {
    await expect(farmsService.createFarm(farmInput)).resolves.toEqual({ id: 'farm-1' });
    expect(prisma.farm.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          farmName: 'Teff plot',
          woredaId: 'woreda-1',
          polygonGeojson: farmInput.polygonGeojson,
        }),
      })
    );
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);
  });

  it('rejects a missing woreda', async () => {
    boundariesService.getWoredaById.mockResolvedValue(null);
    await expect(farmsService.createFarm(farmInput)).rejects.toMatchObject({ statusCode: 404 });
    expect(prisma.farm.create).not.toHaveBeenCalled();
  });
});
