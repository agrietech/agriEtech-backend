const { getEthiopianSeason, getDekadOfYear } = require('../../src/utils/dateUtils');
const { isWithinEthiopia, getDistanceKm } = require('../../src/utils/geoUtils');

describe('Utilities Suite: Date & Geospatial', () => {
  it('should identify Ethiopian agricultural seasons', () => {
    expect(getEthiopianSeason('2026-03-15')).toBe('Belg');
    expect(getEthiopianSeason('2026-07-20')).toBe('Kiremt');
    expect(getEthiopianSeason('2026-11-10')).toBe('Bega');
  });

  it('should calculate Dekad index correctly', () => {
    expect(getDekadOfYear('2026-01-05')).toBe(1);
    expect(getDekadOfYear('2026-01-15')).toBe(2);
    expect(getDekadOfYear('2026-01-25')).toBe(3);
    expect(getDekadOfYear('2026-02-05')).toBe(4);
  });

  it('should validate coordinates within Ethiopia', () => {
    expect(isWithinEthiopia(9.03, 38.74)).toBe(true); // Addis Ababa
    expect(isWithinEthiopia(8.54, 39.27)).toBe(true); // Adama
    expect(isWithinEthiopia(51.50, -0.12)).toBe(false); // London
  });

  it('should calculate geodesic distance between two points', () => {
    const addis = [38.74, 9.03];
    const adama = [39.27, 8.54];
    const dist = getDistanceKm(addis, adama);
    expect(dist).toBeGreaterThan(60);
    expect(dist).toBeLessThan(120);
  });
});
