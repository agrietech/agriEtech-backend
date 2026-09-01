const { evaluateDischargeRisk, evaluateFlashFloodRisk, processData } = require("../../src/processing/floodRiskEvaluator");

const DEFAULT_THRESHOLDS = { q2: 500, q5: 850, q20: 1200 };

describe("Flood Risk Evaluator", () => {
  describe("evaluateDischargeRisk", () => {
    it("returns CRITICAL when discharge >= q20 (1200 m3/s)", () => {
      const result = evaluateDischargeRisk(1300, DEFAULT_THRESHOLDS);
      expect(result.level).toBe("CRITICAL");
      expect(result.score).toBe(1.0);
    });

    it("returns HIGH when discharge between q5 and q20", () => {
      const result = evaluateDischargeRisk(1000, DEFAULT_THRESHOLDS);
      expect(result.level).toBe("HIGH");
      expect(result.score).toBeGreaterThan(0.65);
      expect(result.score).toBeLessThan(1.0);
    });

    it("returns MODERATE when discharge between q2 and q5", () => {
      const result = evaluateDischargeRisk(650, DEFAULT_THRESHOLDS);
      expect(result.level).toBe("MODERATE");
      expect(result.score).toBeGreaterThan(0.35);
      expect(result.score).toBeLessThan(0.65);
    });

    it("returns LOW when discharge < q2", () => {
      const result = evaluateDischargeRisk(200, DEFAULT_THRESHOLDS);
      expect(result.level).toBe("LOW");
      expect(result.score).toBeLessThan(0.35);
    });

    it("returns LOW with score 0 for zero discharge", () => {
      const result = evaluateDischargeRisk(0, DEFAULT_THRESHOLDS);
      expect(result.level).toBe("LOW");
      expect(result.score).toBe(0);
    });
  });

  describe("evaluateFlashFloodRisk", () => {
    it("returns CRITICAL for rainfall >= 100mm/24h", () => {
      expect(evaluateFlashFloodRisk(120).level).toBe("CRITICAL");
    });
    it("returns HIGH for rainfall >= 70mm/24h", () => {
      expect(evaluateFlashFloodRisk(80).level).toBe("HIGH");
    });
    it("returns MODERATE for rainfall >= 40mm/24h", () => {
      expect(evaluateFlashFloodRisk(50).level).toBe("MODERATE");
    });
    it("returns LOW for rainfall < 40mm/24h", () => {
      expect(evaluateFlashFloodRisk(20).level).toBe("LOW");
    });
  });

  describe("processData", () => {
    it("compositeFloodScore is max of hydrologic and flash scores", () => {
      const result = processData({ dischargeM3s: 200, rain24hMm: 110 });
      // Flash score (CRITICAL=0.95) > hydrologic (LOW)
      expect(result.compositeFloodScore).toBe(0.95);
    });

    it("includes woredaId and evaluatedAt", () => {
      const result = processData({ woredaId: "woreda-123", dischargeM3s: 0, rain24hMm: 0 });
      expect(result.woredaId).toBe("woreda-123");
      expect(result.evaluatedAt).toBeDefined();
    });
  });
});
