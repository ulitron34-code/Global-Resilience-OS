// Genera un mapa mundial estilizado como matriz de puntos, sin depender de
// tiles externos ni GeoJSON pesado — esto mantiene la demo 100% portable
// y funcional offline. Los continentes se aproximan con polígonos simplificados.

// Polígonos MUY simplificados por continente [lon, lat] — suficientes para
// una silueta reconocible en un mapa de puntos, no para precisión cartográfica.
const CONTINENTS = {
  northAmerica: [
    [-168, 66], [-150, 70], [-95, 70], [-75, 62], [-65, 45], [-70, 41],
    [-81, 25], [-97, 18], [-105, 20], [-117, 32], [-124, 42], [-130, 55],
    [-140, 60], [-168, 66],
  ],
  southAmerica: [
    [-79, 9], [-70, 12], [-60, 5], [-50, -1], [-35, -8], [-40, -20],
    [-48, -25], [-58, -34], [-68, -55], [-72, -50], [-70, -30], [-78, -5],
    [-79, 9],
  ],
  europe: [
    [-10, 43], [-9, 53], [-2, 58], [10, 60], [25, 60], [30, 55],
    [40, 45], [28, 42], [15, 40], [3, 42], [-10, 43],
  ],
  africa: [
    [-17, 21], [-5, 35], [10, 37], [20, 32], [33, 31], [43, 12],
    [51, 12], [42, -5], [35, -20], [20, -34], [12, -18], [10, 5],
    [-5, 5], [-17, 14], [-17, 21],
  ],
  asia: [
    [28, 42], [40, 45], [55, 42], [50, 30], [60, 25], [70, 20],
    [80, 8], [95, 5], [103, 1], [110, 20], [122, 25], [130, 33],
    [140, 45], [145, 55], [130, 60], [100, 70], [70, 72], [55, 68],
    [40, 65], [28, 55], [28, 42],
  ],
  australia: [
    [113, -22], [122, -18], [136, -12], [142, -11], [148, -20],
    [153, -28], [150, -37], [140, -38], [131, -32], [115, -34], [113, -22],
  ],
  japan: [
    [130, 31], [132, 34], [136, 35], [140, 36], [141, 40], [140, 43],
    [143, 44], [141, 45], [138, 38], [133, 33], [130, 31],
  ],
  greenland: [
    [-73, 70], [-60, 83], [-10, 80], [-40, 60], [-73, 70]
  ],
  madagascar: [
    [43, -25], [47, -25], [51, -12], [49, -12], [43, -25]
  ],
  unitedKingdom: [
    [-8, 50], [-2, 50], [2, 58], [-4, 59], [-8, 50]
  ],
  india: [
    [68, 24], [72, 31], [78, 31], [88, 22], [80, 8], [68, 24]
  ],
  indonesia: [
    [95, -5], [110, -8], [120, -8], [130, -5], [140, -5], [140, 0], [130, 0], [120, 2], [105, 5], [95, -5]
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
 * Genera un array de puntos [lon, lat] espaciados en una grilla que caen
 * dentro de los polígonos continentales simplificados.
 */
export function generateWorldDots(step = 2.2) {
  const dots = [];
  const polys = Object.values(CONTINENTS);
  for (let lon = -180; lon <= 180; lon += step) {
    for (let lat = -58; lat <= 75; lat += step) {
      // Jitter leve para look orgánico, no de grilla perfecta
      const jLon = lon + (Math.random() - 0.5) * step * 0.3;
      const jLat = lat + (Math.random() - 0.5) * step * 0.3;
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

/** Proyección equirectangular simple: lon/lat -> x/y en un viewBox dado */
export function project([lon, lat], width, height) {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return [x, y];
}
