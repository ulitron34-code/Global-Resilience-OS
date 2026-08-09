const ALLOWED_SEVERITIES = new Set(['parcial', 'total']);
const MAX_DURATION_HOURS = 24 * 365;

export function validateSimulationInput(input = {}) {
  const { cableId, severity = 'total', durationHours = 24 } = input;

  if (typeof cableId !== 'string' || cableId.trim() === '') {
    throw new Error('cableId es requerido y debe ser texto');
  }

  if (!ALLOWED_SEVERITIES.has(severity)) {
    throw new Error('severity debe ser parcial o total');
  }

  const normalizedDuration = Number(durationHours);
  if (!Number.isFinite(normalizedDuration) || normalizedDuration <= 0) {
    throw new Error('durationHours debe ser un número mayor que 0');
  }

  if (normalizedDuration > MAX_DURATION_HOURS) {
    throw new Error(`durationHours no puede superar ${MAX_DURATION_HOURS}`);
  }

  return {
    cableId: cableId.trim(),
    severity,
    durationHours: normalizedDuration,
  };
}
