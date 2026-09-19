/**
 * Farm Domain Model
 * Encapsulates agronomic business logic and calculated properties
 */
class Farm {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  get areaInAcres() {
    return parseFloat(((this.areaHectares || 0) * 2.47105).toFixed(2));
  }

  get isLargeScale() {
    return (this.areaHectares || 0) >= 10;
  }

  get isSmallholder() {
    return (this.areaHectares || 0) < 2.0;
  }

  calculateHealthScore() {
    let score = 100;
    if (!this.soilType) score -= 10;
    if (this.diseaseDiagnoses && this.diseaseDiagnoses.length > 0) {
      score -= Math.min(30, this.diseaseDiagnoses.length * 10);
    }
    return Math.max(20, score);
  }

  canPlantCrop(cropType) {
    if (!cropType) return true;
    // Basic agro-ecological compatibility rules
    if (cropType === 'Coffee' && this.areaHectares < 0.25) {
      return false; // Minimum viable economic plot
    }
    return true;
  }

  static fromPrisma(prismaFarm) {
    if (!prismaFarm) return null;
    return new Farm(prismaFarm);
  }
}

module.exports = Farm;
