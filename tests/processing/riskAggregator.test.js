const {
  calculateCompositeRisk,
  getAlertLevel,
  getSeasonalWeights,
  SEASON_WEIGHTS,
} = require("../../src/processing/riskAggregator");

describe("Risk Aggregator", () => {
  describe("getAlertLevel", () => {
    it("returns GREEN for score < 0.25", () => expect(getAlertLevel(0.1)).toBe("GREEN"));
    it("returns YELLOW for score >= 0.25", () => expect(getAlertLevel(0.35)).toBe("YELLOW"));
    it("returns ORANGE for score >= 0.50", () => expect(getAlertLevel(0.6)).toBe("ORANGE"));
    it("returns RED for score >= 0.75", () => expect(getAlertLevel(0.8)).toBe("RED"));
    it("returns RED for perfect score 1.0", () => expect(getAlertLevel(1.0)).toBe("RED"));
  });

  describe("getSeasonalWeights", () => {
    it("returns KIREMT weights for month 7 (July)", () => {
      const w = getSeasonalWeights(7);
      expect(w.season).toBe("KIREMT");
      expect(w.flood).toBe(SEASON_WEIGHTS.KIREMT.flood);
    });
    it("returns BELG weights for month 4 (April)", () => {
      const w = getSeasonalWeights(4);
      expect(w.season).toBe("BELG");
    });
    it("returns DRY weights for month 1 (January)", () => {
      const w = getSeasonalWeights(1);
      expect(w.season).toBe("DRY");
      expect(w.drought).toBe(SEASON_WEIGHTS.DRY.drought);
    });
    it("returns DRY weights for month 12 (December)", () => {
      expect(getSeasonalWeights(12).season).toBe("DRY");
    });
  });

  describe("calculateCompositeRisk", () => {
    it("returns compositeScore clamped between 0 and 1", () => {
      const result = calculateCompositeRisk({ drought: 0.5, flood: 0.5, locust: 0.5, vegetation: 0.5 });
      expect(result.compositeScore).toBeGreaterThanOrEqual(0);
      expect(result.compositeScore).toBeLessThanOrEqual(1);
    });

    it("returns GREEN when all scores are 0", () => {
      const result = calculateCompositeRisk({});
      expect(result.alertLevel).toBe("GREEN");
      expect(result.compositeScore).toBe(0);
    });

    it("returns RED when all scores are 1.0", () => {
      const result = calculateCompositeRisk({ drought: 1, flood: 1, locust: 1, vegetation: 1 });
      expect(result.alertLevel).toBe("RED");
      expect(result.compositeScore).toBe(1);
    });

    it("identifies primaryThreat correctly", () => {
      const result = calculateCompositeRisk({ drought: 0.9, flood: 0.1, locust: 0.1, vegetation: 0.1 });
      expect(result.primaryThreat).toBe("DROUGHT");
    });

    it("returns NONE primaryThreat when all scores are low", () => {
      const result = calculateCompositeRisk({ drought: 0.1, flood: 0.1, locust: 0.1, vegetation: 0.1 });
      expect(result.primaryThreat).toBe("NONE");
    });

    it("customWeights override seasonal weights", () => {
      const custom = { drought: 1.0, flood: 0, locust: 0, vegetation: 0 };
      const result = calculateCompositeRisk({ drought: 1.0, flood: 0, locust: 0, vegetation: 0 }, custom);
      expect(result.compositeScore).toBe(1.0);
    });

    it("includes season in result", () => {
      const result = calculateCompositeRisk({});
      expect(["KIREMT", "BELG", "DRY"]).toContain(result.season);
    });
  });
});
