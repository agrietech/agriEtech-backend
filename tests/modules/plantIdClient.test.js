const plantIdClient = require('../../src/ingestion/plantIdClient');

describe('Plant.id Botanical Client Suite', () => {
  it('should initialize with correct API endpoint', () => {
    expect(plantIdClient.apiUrl).toContain('plant.id');
  });

  it('should identify botanical crop and disease candidates for Maize', async () => {
    const result = await plantIdClient.identifyCropHealth({
      cropHint: 'Maize',
      imageBase64: 'mock_base64_maize_image',
    });

    expect(result.success).toBe(true);
    expect(result.crop.scientificName).toContain('Zea mays');
    expect(result.diseases.length).toBeGreaterThan(0);
    expect(result.diseases[0].probability).toBeGreaterThan(0.5);
  });

  it('should identify botanical crop and disease candidates for Wheat', async () => {
    const result = await plantIdClient.identifyCropHealth({
      cropHint: 'Wheat',
      imageBase64: 'mock_base64_wheat_image',
    });

    expect(result.success).toBe(true);
    expect(result.crop.scientificName).toContain('Triticum aestivum');
    expect(result.diseases.length).toBeGreaterThan(0);
  });
});
