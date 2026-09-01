const { calculateVci } = require("../../src/processing/vegetationStressAnalyzer");

describe("Vegetation Stress Analyzer (VCI)", () => {
  describe("calculateVci", () => {
    it("returns EXTREME_STRESS for very low NDVI", () => {
      const result = calculateVci(0.1, 0.1, 0.8);
      expect(result.vci).toBeLessThan(10);
      expect(result.condition).toBe("EXTREME_STRESS");
      expect(result.stressScore).toBe(1.0);
    });

    it("returns NORMAL for mid-range NDVI", () => {
      const result = calculateVci(0.38, 0.1, 0.8);
      expect(result.vci).toBeGreaterThan(35);
      expect(result.vci).toBeLessThanOrEqual(50);
      expect(result.condition).toBe("NORMAL");
    });


    it("returns EXCELLENT for high NDVI", () => {
      const result = calculateVci(0.8, 0.1, 0.8);
      expect(result.vci).toBeGreaterThan(50);
      expect(result.condition).toBe("EXCELLENT");
      expect(result.stressScore).toBe(0.05);
    });

    it("handles equal min/max gracefully (returns 50/NORMAL)", () => {
      const result = calculateVci(0.5, 0.5, 0.5);
      expect(result.vci).toBe(50.0);
      expect(result.condition).toBe("NORMAL");
    });

    it("clamps NDVI below minimum to 0% VCI", () => {
      const result = calculateVci(0.0, 0.1, 0.8);
      expect(result.vci).toBe(0.0);
      expect(result.stressScore).toBe(1.0);
    });

    it("clamps NDVI above maximum to 100% VCI", () => {
      const result = calculateVci(0.9, 0.1, 0.8);
      expect(result.vci).toBe(100.0);
    });

    it("stressScore is proportional to severity", () => {
      const severe = calculateVci(0.15, 0.1, 0.8); // low VCI ? high stress
      const normal = calculateVci(0.5, 0.1, 0.8);   // mid VCI ? low stress
      expect(severe.stressScore).toBeGreaterThan(normal.stressScore);
    });
  });
});
