import { normalizeOptionalTimestamp } from './timing.js';

const SEVERITIES = new Set(['critical', 'high', 'medium', 'low']);
const EVENT_TYPES = new Set(['ais_gap', 'port_delay', 'cable_degradation', 'market_move', 'geopolitical_signal', 'source_health']);
function iso(value, field) { const parsed = Date.parse(value); if (!Number.isFinite(parsed)) throw new Error(`${field} debe ser ISO-8601 válido`); return new Date(parsed).toISOString(); }
export function validateEventEnvelope(input = {}, { production = process.env.APP_MODE === 'production' } = {}) {
  const required = ['externalId', 'sourceId', 'eventType', 'title', 'severity', 'impactUsd'];
  if (required.some((field) => input[field] === undefined)) throw new Error('Faltan campos requeridos del evento');
  if (typeof input.externalId !== 'string' || input.externalId.trim().length < 2 || input.externalId.length > 200) throw new Error('externalId debe tener entre 2 y 200 caracteres');
  if (typeof input.sourceId !== 'string' || input.sourceId.trim().length < 2 || input.sourceId.length > 120) throw new Error('sourceId inválido');
  if (typeof input.title !== 'string' || input.title.trim().length < 2 || input.title.length > 300) throw new Error('title debe tener entre 2 y 300 caracteres');
  if (typeof input.eventType !== 'string' || input.eventType.trim().length < 2 || input.eventType.length > 100) throw new Error('eventType inválido');
  if (!SEVERITIES.has(input.severity)) throw new Error('severity inválida');
  const impactUsd = Number(input.impactUsd);
  if (!Number.isFinite(impactUsd) || impactUsd < 0) throw new Error('impactUsd debe ser un número no negativo');
  const confidence = input.confidence === undefined ? 0.45 : Number(input.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) throw new Error('confidence debe estar entre 0 y 1');
  const eventType = String(input.eventType).trim();
  if (production && !EVENT_TYPES.has(eventType)) throw new Error(`eventType no permitido en producción: ${eventType}`);
  const observedAt = input.observedAt ? iso(input.observedAt, 'observedAt') : new Date().toISOString();
  const detectedAt = normalizeOptionalTimestamp(input.detectedAt, 'detectedAt');
  const retrievedAt = input.provenance?.retrievedAt ? iso(input.provenance.retrievedAt, 'provenance.retrievedAt') : new Date().toISOString();
  const licenseRef = input.provenance?.licenseRef ? String(input.provenance.licenseRef).slice(0, 200) : null;
  if (production && !licenseRef) throw new Error('provenance.licenseRef es requerido en producción');
  return { schemaVersion: '1.0', externalId: input.externalId.trim(), sourceId: input.sourceId.trim(), eventType, title: input.title.trim(), severity: input.severity, impactUsd, confidence, observedAt, ...(detectedAt ? { detectedAt } : {}), location: input.location ? String(input.location).trim() : 'No especificado', vertical: input.vertical ? String(input.vertical).trim() : 'Oil & Gas', payload: input.payload && typeof input.payload === 'object' ? input.payload : {}, provenance: { uri: input.provenance?.uri ? String(input.provenance.uri).slice(0, 1000) : null, retrievedAt, licenseRef } };
}
