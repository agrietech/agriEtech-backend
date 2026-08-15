const { calculateCompositeRisk, getAlertLevel, DEFAULT_WEIGHTS } = require('../../src/processing/riskAggregator');

describe('Multi-Hazard Risk Aggregator Suite', () => {
  it('should compute weighted composite score accurately', () => {
    const scores = {
      drought: 0.8,
      flood: 0.2,
      locust: 0.1,
      vegetation: 0.5,
    };

    const expectedScore =
      0.8 * DEFAULT_WEIGHTS.drought +
      0.2 * DEFAULT_WEIGHTS.flood +
      0.1 * DEFAULT_WEIGHTS.locust +
      0.5 * DEFAULT_WEIGHTS.vegetation;

    const result = calculateCompositeRisk(scores);
    expect(result.compositeScore).toBeCloseTo(expectedScore, 2);
    expect(result.primaryThreat).toBe('DROUGHT');
  });

  it('should classify alert levels correctly', () => {
    expect(getAlertLevel(0.1)).toBe('GREEN');
    expect(getAlertLevel(0.35)).toBe('YELLOW');
    expect(getAlertLevel(0.6)).toBe('ORANGE');
    expect(getAlertLevel(0.85)).toBe('RED');
  });
});
