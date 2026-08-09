import { validateEventEnvelope } from './eventContract.js';
import { hasCompleteLicenseMetadata } from './dataCatalog.js';
import { isIllustrativeSource } from './sourceClassification.js';
import { evaluateProductiveSource } from './sourceReadiness.js';

export function validateBatchInput(input = {}, sources = [], options = {}) {
  const mode = input.mode === undefined ? 'dry_run' : String(input.mode);
  if (!['dry_run', 'commit'].includes(mode)) throw new Error('mode debe ser dry_run o commit');
  if (!Array.isArray(input.events) || input.events.length < 1 || input.events.length > 100) throw new Error('events debe contener entre 1 y 100 registros');
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const catalogMap = new Map((Array.isArray(options.catalog) ? options.catalog : []).map((item) => [item.id, item]));
  const items = input.events.map((event, index) => {
    try {
      const normalized = validateEventEnvelope(event, options);
      const source = sourceMap.get(normalized.sourceId);
      const record = { ...catalogMap.get(normalized.sourceId), ...source };
      if (!source) throw new Error(`Fuente desconocida: ${normalized.sourceId}`);
      if (options.production) {
        const readiness = evaluateProductiveSource(source, catalogMap.get(normalized.sourceId));
        if (!readiness.ready) throw new Error(`Fuente no apta para producción: ${normalized.sourceId}`);
        if (source.status !== 'connected' || isIllustrativeSource(record) || record.licenseStatus !== 'active' || !hasCompleteLicenseMetadata(record)) throw new Error(`Fuente no apta para producción: ${normalized.sourceId}`);
      }
      return { index, externalId: normalized.externalId, status: 'valid', event: normalized };
    } catch (error) {
      return { index, externalId: event?.externalId || null, status: 'invalid', error: error.message };
    }
  });
  return { mode, items, counts: { total: items.length, valid: items.filter((item) => item.status === 'valid').length, invalid: items.filter((item) => item.status === 'invalid').length }, readyToCommit: items.every((item) => item.status === 'valid'), disclaimer: 'Validación local de lote. El modo dry_run no cambia estado; commit conserva deduplicación y auditoría por evento.' };
}
