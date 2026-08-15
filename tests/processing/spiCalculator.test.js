const spi = require('../../src/processing/spiCalculator');

describe('SPI Calculator Processing Suite', () => {
  it('should export processData interface', () => {
    expect(spi.processData).toBeDefined();
    expect(typeof spi.processData).toBe('function');
  });

  it('should calculate SPI and classify drought severity correctly', () => {
    const history = [120, 110, 115, 105, 130, 95, 125, 118];
    const currentLow = 30; // Severe deficit

    const result = spi.calculateSpi(currentLow, history);
    expect(result.spi).toBeLessThan(0);
    expect(['EXTREME_DROUGHT', 'SEVERE_DROUGHT', 'MODERATE_DROUGHT']).toContain(result.category);
    expect(result.droughtRiskScore).toBeGreaterThan(0.5);
  });

  it('should return near normal status when rainfall matches history', () => {
    const history = [100, 100, 100, 100];
    const result = spi.calculateSpi(100, history);
    expect(result.category).toBe('NEAR_NORMAL');
    expect(result.droughtRiskScore).toBeLessThan(0.3);
  });

  it('should process batch data payloads via processData', () => {
    const payload = {
      woredaId: 'woreda_adama_01',
      currentRainfallMm: 25,
      historicalSeries: [80, 90, 85, 95, 75, 100],
    };

    const out = spi.processData(payload);
    expect(out.woredaId).toBe('woreda_adama_01');
    expect(out.calculatedAt).toBeDefined();
    expect(out.gammaParams).toBeDefined();
    expect(out.droughtRiskScore).toBeDefined();
  });
});
