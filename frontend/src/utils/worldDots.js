// Geographic generator and projector for Global Resilience OS
// Provides detailed vector silhouettes for continents, Mexico, peninsulas, and islands
// plus the command-center tactical point matrix.

export const DETAILED_CONTINENTS = {
  // Mexico and Central America (detailed with Baja California and Yucatan)
  mexicoLow: [
    [-117.0, 32.5], [-115.0, 31.0], [-112.0, 28.0], [-109.8, 23.0],
    [-110.8, 24.3], [-113.5, 29.5], [-115.8, 31.8], [-117.0, 32.5]
  ],
  mexicoMainland: [
    [-117.0, 32.5], [-111.0, 28.0], [-106.5, 31.8], [-104.0, 30.0],
    [-97.0, 26.5], [-97.5, 22.0], [-96.0, 19.5], [-90.5, 21.5],
    [-87.5, 21.5], [-87.0, 18.0], [-89.5, 17.5], [-92.5, 14.5],
    [-96.0, 15.5], [-99.0, 16.5], [-105.0, 19.8], [-109.0, 25.5],
    [-114.5, 31.0], [-117.0, 32.5]
  ],
  centralAmerica: [
    [-92.5, 14.5], [-88.5, 15.8], [-83.5, 15.0], [-77.5, 8.5],
    [-78.5, 7.5], [-83.0, 8.2], [-85.5, 10.8], [-89.5, 13.2], [-92.5, 14.5]
  ],

  // North America (US, Canada, Alaska)
  northAmericaMain: [
    [-168.0, 65.5], [-160.0, 70.5], [-140.0, 69.5], [-120.0, 69.0],
    [-95.0, 70.0], [-80.0, 62.0], [-64.0, 60.0], [-55.0, 52.0],
    [-65.0, 44.0], [-71.0, 42.0], [-80.0, 25.0], [-81.8, 24.5],
    [-85.0, 30.0], [-97.0, 26.5], [-104.0, 30.0], [-106.5, 31.8],
    [-117.0, 32.5], [-124.0, 42.0], [-124.0, 48.5], [-130.0, 55.0],
    [-141.0, 60.0], [-153.0, 59.0], [-168.0, 65.5]
  ],
  florida: [
    [-85.0, 30.0], [-80.0, 25.0], [-80.5, 27.0], [-81.8, 30.5], [-85.0, 30.0]
  ],
  caribbean: [
    [-84.0, 22.5], [-75.0, 20.0], [-74.0, 23.0], [-84.0, 23.0], [-84.0, 22.5]
  ],

  // South America
  southAmerica: [
    [-77.5, 8.5], [-72.0, 12.0], [-60.0, 9.0], [-50.0, 1.5],
    [-35.0, -5.0], [-35.0, -9.0], [-41.0, -22.0], [-48.0, -28.0],
    [-58.0, -38.0], [-67.0, -55.0], [-75.0, -50.0], [-72.0, -38.0],
    [-70.0, -18.0], [-81.0, -4.0], [-79.0, 2.0], [-77.5, 8.5]
  ],

  // Europe y Escandinavia
  europeMain: [
    [-9.5, 37.0], [-9.5, 43.5], [-1.5, 43.5], [-4.5, 48.5],
    [2.5, 51.0], [7.0, 53.5], [10.0, 57.5], [20.0, 55.0],
    [28.0, 60.0], [30.0, 70.0], [40.0, 65.0], [55.0, 60.0],
    [45.0, 46.0], [35.0, 46.0], [28.0, 41.0], [23.0, 38.0],
    [15.0, 40.0], [12.0, 44.0], [3.0, 43.0], [-3.0, 40.0], [-9.5, 37.0]
  ],
  scandinavia: [
    [5.0, 58.0], [11.0, 59.0], [18.0, 60.0], [28.0, 60.0],
    [30.0, 70.0], [20.0, 70.0], [12.0, 63.0], [5.0, 62.0], [5.0, 58.0]
  ],
  unitedKingdom: [
    [-6.0, 50.0], [1.5, 51.0], [0.0, 58.0], [-6.0, 58.5], [-6.0, 50.0]
  ],
  ireland: [
    [-10.5, 51.5], [-6.0, 52.0], [-6.0, 55.5], [-10.5, 54.5], [-10.5, 51.5]
  ],
  iberia: [
    [-9.5, 37.0], [-9.5, 43.5], [-3.0, 43.5], [3.0, 42.0],
    [0.0, 38.0], [-5.0, 36.0], [-9.5, 37.0]
  ],
  italy: [
    [8.0, 45.5], [13.0, 45.8], [14.0, 41.0], [18.5, 40.0],
    [16.0, 38.0], [14.0, 37.0], [12.0, 42.0], [8.0, 45.5]
  ],

  // Africa
  africaMain: [
    [-17.5, 14.5], [-17.0, 21.0], [-13.0, 28.0], [-5.5, 36.0],
    [11.0, 37.5], [25.0, 32.0], [34.0, 28.0], [43.0, 12.5],
    [51.5, 12.0], [41.0, -10.0], [33.0, -27.0], [20.0, -34.8],
    [18.0, -34.0], [12.0, -15.0], [9.0, 4.5], [-5.0, 5.0],
    [-15.0, 11.0], [-17.5, 14.5]
  ],
  madagascar: [
    [43.5, -25.5], [47.0, -25.0], [50.5, -12.5], [49.0, -12.0], [43.5, -25.5]
  ],

  // Asia y Oriente Medio
  middleEast: [
    [34.0, 28.0], [40.0, 37.0], [50.0, 30.0], [56.0, 27.0],
    [60.0, 25.0], [55.0, 16.0], [45.0, 13.0], [43.0, 12.5], [34.0, 28.0]
  ],
  asiaMain: [
    [40.0, 37.0], [55.0, 60.0], [70.0, 73.0], [100.0, 73.0],
    [140.0, 70.0], [170.0, 66.0], [140.0, 50.0], [130.0, 42.0],
    [120.0, 38.0], [120.0, 30.0], [108.0, 20.0], [100.0, 10.0],
    [95.0, 16.0], [88.0, 22.0], [78.0, 31.0], [68.0, 24.0],
    [60.0, 25.0], [50.0, 30.0], [40.0, 37.0]
  ],
  india: [
    [68.0, 24.0], [78.0, 31.0], [88.0, 22.0], [80.0, 8.5], [73.0, 15.0], [68.0, 24.0]
  ],
  japan: [
    [130.5, 31.0], [136.0, 35.0], [141.0, 41.0], [145.0, 44.0],
    [140.0, 45.5], [138.0, 37.0], [130.5, 31.0]
  ],
  southeastAsia: [
    [100.0, 10.0], [108.0, 20.0], [108.0, 10.0], [104.0, 1.5],
    [100.0, 6.0], [100.0, 10.0]
  ],
  indonesiaSumatraJava: [
    [95.0, 5.5], [105.0, -6.0], [115.0, -8.5], [114.0, -7.0],
    [106.0, -2.0], [95.0, 5.5]
  ],

  // Oceania and Australia
  australia: [
    [113.0, -26.0], [115.0, -34.5], [130.0, -32.0], [148.0, -38.0],
    [153.5, -28.0], [142.0, -10.5], [130.0, -12.0], [122.0, -17.0],
    [113.0, -26.0]
  ],
  newZealandNorth: [
    [172.0, -34.5], [178.0, -37.5], [175.0, -41.5], [172.0, -34.5]
  ],
  newZealandSouth: [
    [166.0, -46.5], [174.0, -41.5], [170.0, -46.0], [166.0, -46.5]
  ]
};

function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Generates a tactical point matrix constrained to continental geometries.
 */
export function generateWorldDots(step = 2.0) {
  const dots = [];
  const polys = Object.values(DETAILED_CONTINENTS);
  for (let lon = -180; lon <= 180; lon += step) {
    for (let lat = -58; lat <= 75; lat += step) {
      const jLon = lon + (Math.random() - 0.5) * step * 0.25;
      const jLat = lat + (Math.random() - 0.5) * step * 0.25;
      for (const poly of polys) {
        if (pointInPolygon([jLon, jLat], poly)) {
          dots.push([jLon, jLat]);
          break;
        }
      }
    }
  }
  return dots;
}

/** Simple equirectangular projection: lon/lat -> x/y in a given viewBox. */
export function project([lon, lat], width, height) {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return [x, y];
}

/**
 * Generates projected SVG path strings ("M x y L x y Z") for every continental polygon.
 */
export function getContinentPaths(width, height) {
  return Object.entries(DETAILED_CONTINENTS).map(([key, points]) => {
    const projected = points.map((p) => project(p, width, height));
    const d = projected.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';
    return { id: key, d };
  });
}



