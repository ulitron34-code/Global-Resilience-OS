export function normalizeOptionalTimestamp(value, field) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${field} debe ser ISO-8601 válido`);
  return new Date(parsed).toISOString();
}

export function durationMinutes(start, end) {
  const delta = Date.parse(end || '') - Date.parse(start || '');
  return Number.isFinite(delta) && delta >= 0 ? delta / 60000 : null;
}

export function averageDuration(values) {
  const valid = values.filter((value) => value !== null && Number.isFinite(value));
  return valid.length ? Number((valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(2)) : null;
}
