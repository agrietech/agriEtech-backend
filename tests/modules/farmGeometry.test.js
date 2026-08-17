const { assertContainedByWoreda, validateFarmPolygon } = require('../../src/modules/farms/farmGeometry');

const woreda = {
  type: 'Polygon',
  coordinates: [
    [
      [39, 8],
      [40, 8],
      [40, 9],
      [39, 9],
      [39, 8],
    ],
  ],
};

const farmInside = {
  type: 'Polygon',
  coordinates: [
    [
      [39.2, 8.2],
      [39.4, 8.2],
      [39.4, 8.4],
      [39.2, 8.4],
      [39.2, 8.2],
    ],
  ],
};

describe('farm geometry validation', () => {
  it('accepts a valid polygon entirely inside its woreda', () => {
    const polygon = validateFarmPolygon(farmInside);
    expect(() => assertContainedByWoreda(polygon, woreda)).not.toThrow();
  });

  it('rejects malformed polygon coordinates', () => {
    expect(() => validateFarmPolygon({ type: 'Polygon', coordinates: [[[39, 8], [40, 8]]] })).toThrow(
      'invalid polygon coordinates'
    );
  });

  it('rejects a polygon outside the selected woreda', () => {
    const outside = {
      ...farmInside,
      coordinates: [
        [
          [40.2, 8.2],
          [40.4, 8.2],
          [40.4, 8.4],
          [40.2, 8.4],
          [40.2, 8.2],
        ],
      ],
    };
    expect(() => assertContainedByWoreda(validateFarmPolygon(outside), woreda)).toThrow('entirely within');
  });
});
