const { calculateSpi, classifySpiCategory } = require("../../src/processing/spiCalculator");

describe("SPI Calculator", () => {
  describe("classifySpiCategory", () => {
    it("classifies extreme drought (SPI <= -2.0)", () => {
      expect(classifySpiCategory(-2.0)).toBe("EXTREME_DROUGHT");
      expect(classifySpiCategory(-2.5)).toBe("EXTREME_DROUGHT");
    });
    it("classifies severe drought (-2.0 < SPI <= -1.5)", () => {
      expect(classifySpiCategory(-1.5)).toBe("SEVERE_DROUGHT");
      expect(classifySpiCategory(-1.8)).toBe("SEVERE_DROUGHT");
    });
    it("classifies moderate drought (-1.5 < SPI <= -1.0)", () => {
      expect(classifySpiCategory(-1.0)).toBe("MODERATE_DROUGHT");
      expect(classifySpiCategory(-1.2)).toBe("MODERATE_DROUGHT");
    });
    it("classifies near normal (-1.0 < SPI < 1.0)", () => {
      expect(classifySpiCategory(0.0)).toBe("NEAR_NORMAL");
      expect(classifySpiCategory(0.5)).toBe("NEAR_NORMAL");
      expect(classifySpiCategory(-0.5)).toBe("NEAR_NORMAL");
    });
    it("classifies wet conditions (SPI >= 1.0)", () => {
      expect(classifySpiCategory(1.2)).toBe("MODERATELY_WET");
      expect(classifySpiCategory(1.7)).toBe("VERY_WET");
      expect(classifySpiCategory(2.5)).toBe("EXTREMELY_WET");
    });

  });

  describe("calculateSpi", () => {
    const historicalRainfall = [80, 90, 100, 70, 95, 85, 60, 110, 75, 88];

    it("returns near normal for average rainfall", () => {
      const avgRain = historicalRainfall.reduce((a, b) => a + b, 0) / historicalRainfall.length;
      const result = calculateSpi(avgRain, historicalRainfall);
      expect(result.spi).toBeCloseTo(0, 1);
      expect(result.category).toBe("NEAR_NORMAL");
    });

    it("returns drought for significantly below-average rainfall", () => {
      const result = calculateSpi(10, historicalRainfall);
      expect(result.spi).toBeLessThan(-1.0);
      expect(result.droughtRiskScore).toBeGreaterThan(0.3);
    });

    it("returns wet for above-average rainfall", () => {
      const result = calculateSpi(200, historicalRainfall);
      expect(result.spi).toBeGreaterThan(1.0);
    });

    it("handles empty historical series gracefully", () => {
      const result = calculateSpi(50, []);
      expect(result.spi).toBe(0.0);
      expect(result.category).toBe("NEAR_NORMAL");
    });

    it("clamps SPI to [-3.5, 3.5] range", () => {
      const result = calculateSpi(0, historicalRainfall);
      expect(result.spi).toBeGreaterThanOrEqual(-3.5);
      expect(result.spi).toBeLessThanOrEqual(3.5);
    });

    it("droughtRiskScore is 1.0 for extreme drought", () => {
      const result = calculateSpi(0, [100, 110, 90, 95, 105, 100, 98, 102, 99, 101, 97, 103]);
      expect(result.droughtRiskScore).toBe(1.0);
    });
  });
});
