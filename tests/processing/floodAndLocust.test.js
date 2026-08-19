const {
  evaluateDischargeRisk,
  evaluateFlashFloodRisk,
} = require('../../src/processing/floodRiskEvaluator');
const { matchLocustThreat } = require('../../src/processing/locustZoneMatcher');
const { calculateVci } = require('../../src/processing/vegetationStressAnalyzer');

describe('Processing Analytics - Flood, Locust & Vegetation Stress Engine', () => {
  describe('Flood Risk Evaluator', () => {
    it('should classify river discharge >= Q20 as CRITICAL', () => {
      const res = evaluateDischargeRisk(1350, { q2: 500, q5: 850, q20: 1200 });
      expect(res.level).toBe('CRITICAL');
      expect(res.score).toBe(1.0);
    });

    it('should classify normal flow as LOW', () => {
      const res = evaluateDischargeRisk(300, { q2: 500, q5: 850, q20: 1200 });
      expect(res.level).toBe('LOW');
      expect(res.score).toBeLessThan(0.35);
    });

    it('should classify high 24h rainfall as CRITICAL flash flood threat', () => {
      const res = evaluateFlashFloodRisk(120);
      expect(res.level).toBe('CRITICAL');
      expect(res.score).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('Locust Zone Matcher', () => {
    const polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [39.0, 8.0],
          [40.0, 8.0],
          [40.0, 9.0],
          [39.0, 9.0],
          [39.0, 8.0],
        ],
      ],
    };

    it('should detect swarm direct hit within polygon as HIGH threat', () => {
      const swarms = [{ lat: 8.5, lng: 39.5, threatType: 'SWARM' }];
      const result = matchLocustThreat(swarms, polygon);

      expect(result.threatLevel).toBe('HIGH');
      expect(result.locustRiskScore).toBeGreaterThanOrEqual(0.7);
      expect(result.matchedReports[0].directHit).toBe(true);
    });

    it('should handle no swarms gracefully with 0.0 risk score', () => {
      const result = matchLocustThreat([], polygon);
      expect(result.threatLevel).toBe('NONE');
      expect(result.locustRiskScore).toBe(0.0);
    });
  });

  describe('Vegetation Stress Analyzer (VCI)', () => {
    it('should classify VCI < 10 as EXTREME_STRESS', () => {
      // With min 0.1, max 0.8, ndvi 0.12 gives VCI ~ 2.8%
      const res = calculateVci(0.12, 0.1, 0.8);
      expect(res.condition).toBe('EXTREME_STRESS');
      expect(res.stressScore).toBe(1.0);
    });

    it('should classify VCI > 50 as EXCELLENT', () => {
      // ndvi 0.6 gives VCI ~ 71.4%
      const res = calculateVci(0.6, 0.1, 0.8);
      expect(res.condition).toBe('EXCELLENT');
      expect(res.stressScore).toBeLessThan(0.1);
    });
  });
});
