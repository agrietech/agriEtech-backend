const connectors = require('../../src/ingestion/connectors');

describe('External Connectors Ingestion Suite', () => {
  it('should define all connector interfaces', () => {
    expect(connectors.chirpsConnector).toBeDefined();
    expect(connectors.openMeteoConnector).toBeDefined();
    expect(connectors.glofasConnector).toBeDefined();
    expect(connectors.nasaPowerConnector).toBeDefined();
    expect(connectors.ndviConnector).toBeDefined();
    expect(connectors.faoLocustConnector).toBeDefined();
  });

  it('should fetch rainfall from CHIRPS connector', async () => {
    const data = await connectors.chirpsConnector.fetchRainfallByLocation({
      lat: 8.54,
      lng: 39.27,
      startDate: '2026-08-01',
      endDate: '2026-08-15',
    });
    expect(data.source).toBe('CHIRPS');
    expect(data.precipitationMm).toBeDefined();
  });

  it('should fetch discharge from GloFAS connector', async () => {
    const data = await connectors.glofasConnector.fetchDischarge({ basinName: 'Awash' });
    expect(data.basin).toBe('Awash');
    expect(data.currentDischargeM3s).toBeGreaterThan(0);
    expect(data.returnPeriodThresholds).toBeDefined();
  });
});
